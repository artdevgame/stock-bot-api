import { valid as isSymbolValid } from 'check-ticker-symbol';
import config from 'config';
import fs from 'fs';
import { isIsinValid } from 'js-isin-validator';

import { logger } from '../helpers/logger';
import * as promiseHelper from '../helpers/promise';
import { DestructuredPromise } from '../helpers/promise';
import { readFromRedis, writeToRedis } from '../helpers/redis';
import { Dividend, FetchDividend, FetchInstrumentWithIsin, FetchInstrumentWithSymbol, Instrument } from './types';

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

export async function cacheInstrument(intstrument: Instrument) {
  const value = JSON.stringify(intstrument);
  await writeToRedis(`instrument-symbol-${intstrument.symbol}`, value, { ttl: Infinity });
  await writeToRedis(`instrument-isin-${intstrument.isin}`, value, { ttl: Infinity });
}

export async function fetchDividend({ instrument }: FetchDividend) {
  logger.info(`Fetching dividend with instrument: ${JSON.stringify(instrument)}`);

  const { isin } = instrument;
  const cachedDividend = await readFromRedis(`dividend-${isin}`);

  if (cachedDividend) {
    logger.info(`Retrieved dividend from Redis: ${isin}`);
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

  await writeToRedis(`dividend-${isin}`, JSON.stringify(dividend));

  return dividend;
}

export async function fetchInstrumentWithIsin({ isin }: FetchInstrumentWithIsin) {
  logger.info(`Fetching instrument with ISIN: ${isin}`);

  if (!isIsinValid(isin)) {
    throw new Error(`ISIN is invalid: ${isin}`);
  }

  const cachedInstrument = await readFromRedis(`instrument-isin-${isin}`);

  if (cachedInstrument) {
    logger.info(`Retrieved instrument from Redis: fetchInstrumentWithIsin(${isin})`);
    return JSON.parse(cachedInstrument);
  }

  const suppliers = await getSuppliers(config.get('instruments.fetchWithIsin') as string[]);

  const queue: DestructuredPromise<Instrument>[] = suppliers.reduce((prev, supplier) => {
    if (typeof supplier !== 'undefined' && 'fetchInstrumentWithIsin' in supplier) {
      return [...prev, [supplier.fetchInstrumentWithIsin, { isin }] as DestructuredPromise<Instrument>];
    }
    return prev;
  }, [] as DestructuredPromise<Instrument>[]);

  const instrument: Instrument = await promiseHelper.first<Instrument>(queue);

  await cacheInstrument(instrument);

  return instrument;
}

export async function fetchInstrumentWithSymbol({ symbol }: FetchInstrumentWithSymbol) {
  logger.info(`Fetching instrument with symbol: ${symbol}`);

  if (!isSymbolValid(symbol)) {
    throw new Error(`Symbol is invalid: ${symbol}`);
  }

  const cachedInstrument = await readFromRedis(`instrument-symbol-${symbol}`);

  if (cachedInstrument) {
    logger.info(`Retrieved instrument from Redis: fetchInstrumentWithSymbol(${symbol})`);
    return JSON.parse(cachedInstrument) as Instrument;
  }

  const suppliers = await getSuppliers(config.get('instruments.fetchWithSymbol') as string[]);

  const queue: DestructuredPromise<Instrument>[] = suppliers.reduce((prev, supplier) => {
    if (typeof supplier !== 'undefined' && 'fetchInstrumentWithSymbol' in supplier) {
      return [...prev, [supplier.fetchInstrumentWithSymbol, { symbol }] as DestructuredPromise<Instrument>];
    }
    return prev;
  }, [] as DestructuredPromise<Instrument>[]);

  const instrument: Instrument = await promiseHelper.first<Instrument>(queue);

  await cacheInstrument(instrument);

  return instrument;
}
