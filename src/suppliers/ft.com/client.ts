import dayjs from 'dayjs';
import fetch from 'node-fetch';
import { parse } from 'node-html-parser';

import { NotADividendStockError } from '../../errors/NotADividendStockError';
import * as cache from '../../helpers/cache';
import { logger } from '../../helpers/logger';
import { round } from '../../helpers/number';
import { FetchSupplierDividendParams } from '../types';
import { Dividend } from './types';

interface GetSecurity {
  isin: string;
}

async function getDemoKey() {
  const cacheOptions = {
    contentType: cache.ContentType.TEXT,
    filename: 'demo-key.txt',
    path: `${__dirname}/.cache`,
    purgeDate: dayjs().startOf('day').add(1, 'day').toISOString(),
  };

  cache.pruneCache(cacheOptions);

  const cachedKey = cache.readFromCache(cacheOptions);

  if (cachedKey) {
    return cachedKey;
  }

  const apiDocsRes = await fetch('https://markets.ft.com/research/webservices/securities/v1/docs');

  if (!apiDocsRes.ok) {
    throw new Error(`Couldn't connect to ft.com dividend docs for API key`);
  }

  const apiDocs = await apiDocsRes.text();
  const document = parse(apiDocs);

  const exampleRequestButton = document.querySelector('.mod-api-example__go-btn');

  const url = new URL(exampleRequestButton.getAttribute('href') as string);
  const source = url.searchParams.get('source');

  cache.writeToCache(source, cacheOptions);

  return source;
}

async function getSecurity({ isin }: GetSecurity) {
  const cacheOptions = { filename: `${isin}.json`, path: `${__dirname}/.cache/securities` };

  cache.pruneCache(cacheOptions);

  const cachedSecurity = await cache.readFromCache(cacheOptions);

  if (typeof cachedSecurity !== 'undefined') {
    return cachedSecurity as Dividend;
  }

  logger.info(`Searching for stock on ft.com: ${isin}`);

  const apiKey = await getDemoKey();
  const securityRes = await fetch(
    `https://markets.ft.com/research/webservices/securities/v1/dividends?symbols=${isin}&source=${apiKey}`,
  );

  if (!securityRes.ok) {
    throw new Error(`Unable to retrieve stock info from ft.com: ${isin}`);
  }

  const securities = await securityRes.json();
  const items = securities.data.items as Dividend[];

  if (!items.length) {
    throw new Error(`No results from ft.com for: ${isin}`);
  }

  const [security] = items;

  cache.writeToCache(security, cacheOptions);

  return security as Dividend;
}

export async function fetchDividend({ instrument }: FetchSupplierDividendParams) {
  const { isin } = instrument;

  logger.info(`Fetching dividend information from ft.com: ${isin}`);

  const security = await getSecurity({ isin });
  const { dividendData } = security;

  if (typeof dividendData.yield_TTM === 'undefined') {
    throw new NotADividendStockError(`No yield information from ft.com: ${isin}`);
  }

  logger.info(`ft.com provided dividend data: ${dividendData.yield_TTM}`);

  return { dividendYield: round(dividendData.yield_TTM / 100, 8) };
}
