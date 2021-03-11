import config from 'config';
import fs from 'fs';
import { isIsinValid } from 'js-isin-validator';
import { v5 as uuid } from 'uuid';

import * as cache from '../helpers/cache';
import { logger } from '../helpers/logger';
import * as promiseHelper from '../helpers/promise';
import { DestructuredPromise } from '../helpers/promise';
import { readFromRedis, writeToRedis } from '../helpers/redis';
import {
  Dividend,
  FetchDividendParams,
  FetchInstrumentWithIsinParams,
  FetchInstrumentWithSymbolParams,
  Instrument,
} from './types';

type DividendMaxClient = typeof import('./dividendmax.com/client');
type FinkiIOClient = typeof import('./finki.io/client');
type InvestingClient = typeof import('./investing.com/client');
type Trading212Client = typeof import('./trading212.com/client');

type ImportedClient = DividendMaxClient | FinkiIOClient | InvestingClient | Trading212Client;

async function getSuppliers(suppliers: string[]) {
  const promises: Promise<ImportedClient>[] = suppliers.reduce((prev, supplier) => {
    const supplierPath = `${__dirname}/${supplier}/client.ts`;

    if (fs.existsSync(supplierPath)) {
      return [...prev, import(supplierPath)];
    }

    return prev;
  }, [] as Promise<ImportedClient>[]);

  return Promise.all(promises);
}

export async function cacheInstrument(instrument: Instrument) {
  const { id, isin, symbol } = instrument;
  const value = JSON.stringify(instrument);

  const cacheOptions = { filename: 'instruments.json', path: `${__dirname}`, purgeDate: cache.NeverPurge };
  const instruments: Record<string, Instrument> = (await cache.readFromCache(cacheOptions)) ?? {};

  cache.writeToCache({ ...instruments, [id]: instrument }, cacheOptions);

  await writeToRedis(`instrument-id-${id}`, value, { ttl: Infinity });
  await writeToRedis(`instrument-isin-${isin}`, value, { ttl: Infinity });
  await writeToRedis(`instrument-symbol-${symbol}`, value, { ttl: Infinity });

  return { id };
}

export async function fetchDividend({ id }: FetchDividendParams) {
  logger.info(`Fetching dividend with instrument id: ${id}`);

  const cachedInstrument = await readFromRedis(`instrument-id-${id}`);

  if (!cachedInstrument) {
    throw new Error(
      `Unable to retrieve dividend using instrument id: ${id}, try querying the fetchInstrument endpoint again`,
    );
  }

  const instrument = JSON.parse(cachedInstrument) as Instrument;
  const cachedDividend = await readFromRedis(`dividend-${id}`);

  if (cachedDividend) {
    logger.info(`Retrieved dividend from Redis: ${id}`);
    return JSON.parse(cachedDividend) as Dividend;
  }

  const suppliers = await getSuppliers(config.get('dividends.fetchDividend') as string[]);

  const queue: DestructuredPromise<Dividend>[] = suppliers.reduce((prev, supplier) => {
    if (typeof supplier !== 'undefined' && 'fetchDividend' in supplier) {
      return [...prev, [supplier.fetchDividend, { instrument }] as DestructuredPromise<Dividend>];
    }
    return prev;
  }, [] as DestructuredPromise<Dividend>[]);

  const dividend: Dividend = await promiseHelper.first<Dividend>(queue);

  await writeToRedis(`dividend-${id}`, JSON.stringify(dividend));

  return dividend;
}

export async function fetchInstrumentWithIsin({ isin }: FetchInstrumentWithIsinParams): Promise<{ id: string }> {
  logger.info(`Fetching instrument with ISIN: ${isin}`);

  if (!isIsinValid(isin)) {
    throw new Error(`ISIN is invalid: ${isin}`);
  }

  const cachedInstrument = await readFromRedis(`instrument-isin-${isin}`);

  if (cachedInstrument) {
    const { id } = JSON.parse(cachedInstrument);

    logger.info(`Retrieved instrument from Redis: fetchInstrumentWithIsin(${isin}) -> ${id}`);

    return { id };
  }

  const suppliers = await getSuppliers(config.get('instruments.fetchWithIsin') as string[]);

  const queue: DestructuredPromise<Instrument>[] = suppliers.reduce((prev, supplier) => {
    if (typeof supplier !== 'undefined' && 'fetchInstrumentWithIsin' in supplier) {
      return [...prev, [supplier.fetchInstrumentWithIsin, { isin }] as DestructuredPromise<Instrument>];
    }
    return prev;
  }, [] as DestructuredPromise<Instrument>[]);

  const instrument: Instrument = await promiseHelper.first<Instrument>(queue);

  return cacheInstrument(instrument);
}

export async function fetchInstrumentWithSymbol({ symbol }: FetchInstrumentWithSymbolParams): Promise<{ id: string }> {
  logger.info(`Fetching instrument with symbol: ${symbol}`);

  const cachedInstrument = await readFromRedis(`instrument-symbol-${symbol}`);

  if (cachedInstrument) {
    const { id } = JSON.parse(cachedInstrument);

    logger.info(`Retrieved instrument from Redis: fetchInstrumentWithSymbol(${symbol}) -> ${id}`);

    return { id };
  }

  const suppliers = await getSuppliers(config.get('instruments.fetchWithSymbol') as string[]);

  const queue: DestructuredPromise<Instrument>[] = suppliers.reduce((prev, supplier) => {
    if (typeof supplier !== 'undefined' && 'fetchInstrumentWithSymbol' in supplier) {
      return [...prev, [supplier.fetchInstrumentWithSymbol, { symbol }] as DestructuredPromise<Instrument>];
    }
    return prev;
  }, [] as DestructuredPromise<Instrument>[]);

  const instrument: Instrument = await promiseHelper.first<Instrument>(queue);

  return cacheInstrument(instrument);
}

export function getInstrumentId({ isin }: { isin: string }) {
  const instrumentNamespace: string = config.get('server.instrumentUuidNamespace');
  return uuid(isin, instrumentNamespace);
}

export function preheatInstrumentCache() {
  const cacheOptions = { filename: 'instruments.json', path: __dirname };

  const cachedInstruments = cache.readFromCache(cacheOptions) as Instrument[];

  if (typeof cachedInstruments === 'undefined') {
    return;
  }

  const instruments = Object.values(cachedInstruments).map((instrument) => cacheInstrument(instrument));

  return Promise.all(instruments);
}
