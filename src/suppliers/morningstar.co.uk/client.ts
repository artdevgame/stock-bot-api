/**
 * morningstar.co.uk
 *
 * results are unreliable without providing an exchange
 */
import fetch from 'node-fetch';
import { parse } from 'node-html-parser';

import { getInstrumentId } from '..';
import * as cache from '../../helpers/cache';
import { logger } from '../../helpers/logger';
import { round } from '../../helpers/number';
import { Dividend, FetchInstrumentWithSymbolParams, FetchSupplierDividendParams, Instrument } from '../types';
import { Security } from './types';

const { ContentType } = cache;

interface FetchSearchResult {
  symbol: string;
}

interface FetchStockInfo {
  id: string;
  symbol: string;
}

interface ParseDividend {
  html: string;
}

interface ParseIsin {
  html: string;
}

async function fetchSearchResult({ symbol }: FetchSearchResult): Promise<Security> {
  const cacheOptions = { filename: `search-result.json`, path: `${__dirname}/.cache/${symbol}` };

  cache.pruneCache(cacheOptions);

  const cachedSecurity = cache.readFromCache<Security>(cacheOptions);

  if (typeof cachedSecurity !== 'undefined') {
    logger.info(`Using morningstar.co.uk FS cache (fetchSearchResult): ${symbol}`);
    return cachedSecurity;
  }

  logger.info(`Searching for stock on morningstar.co.uk: ${symbol}`);

  const searchResultsRes = await fetch(`https://www.morningstar.co.uk/uk/util/SecuritySearch.ashx?q=${symbol}`);

  if (!searchResultsRes.ok) {
    throw new Error(`Unable to fetch stock security from morningstar.co.uk: ${symbol}`);
  }

  const responseBody = await searchResultsRes.text();

  const allSecurities = responseBody
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        const security = JSON.parse(line.split('|')[1]) as Security;
        return security;
      } catch (err) {
        return undefined;
      }
    });

  const security = allSecurities.find((s) => s?.s === symbol);

  if (typeof security === 'undefined') {
    throw new Error(`Stock not found in morningstar.co.uk search results: ${symbol}`);
  }

  cache.writeToCache(security, cacheOptions);

  return security;
}

async function fetchStockInfo({ id, symbol }: FetchStockInfo) {
  const cacheOptions = {
    contentType: ContentType.TEXT,
    filename: `stock-info.html`,
    path: `${__dirname}/.cache/${symbol}`,
  };

  cache.pruneCache(cacheOptions);

  const info = cache.readFromCache<string>(cacheOptions);

  if (typeof info !== 'undefined') {
    logger.info(`Using morningstar.co.uk FS cache (fetchStockInfo): ${symbol}`);
    return info;
  }

  const stockInfoRes = await fetch(`https://tools.morningstar.co.uk/uk/stockreport/default.aspx?id=${id}`);

  if (!stockInfoRes.ok) {
    throw new Error(`Unable to retrieve stock info from morningstar.co.uk: ${symbol}`);
  }

  const stockInfo = await stockInfoRes.text();

  cache.writeToCache(stockInfo, cacheOptions);

  logger.info(`Cached morningstar.co.uk stock info page: ${symbol}`);

  return stockInfo;
}

function parseDividend({ html }: ParseDividend) {
  const dividend = {
    dividendYield: 0,
  };

  const document = parse(html);
  const dividendYieldContainer = document.querySelector('#Col0Yield');

  if (typeof dividendYieldContainer !== 'undefined') {
    const dividendYield = round(Number(dividendYieldContainer.innerText) / 100, 8);
    dividend.dividendYield = dividendYield;
  } else {
    logger.warn(`Unable to find the dividend yield container from morningstar.co.uk html`);
  }

  return dividend;
}

function parseIsin({ html }: ParseIsin) {
  const document = parse(html);
  const isinContainer = document.querySelector('#Col0Isin');

  return isinContainer.innerText;
}

export async function fetchDividend({ instrument }: FetchSupplierDividendParams) {
  const { symbol } = instrument;

  logger.info(`Fetching dividend information from morningstar.co.uk: ${symbol}`);

  const searchResult = await fetchSearchResult({ symbol });
  const { i: supplierId } = searchResult;

  const stockInfo = await fetchStockInfo({ id: supplierId, symbol });

  const dividend = parseDividend({ html: stockInfo });
  const { dividendYield } = dividend;

  return { dividendYield } as Dividend;
}

export async function fetchInstrumentWithSymbol({ symbol }: FetchInstrumentWithSymbolParams) {
  try {
    logger.info(`Fetching instrument from morningstar.co.uk: ${symbol}`);

    const searchResult = await fetchSearchResult({ symbol });
    const { i: supplierId, n: name } = searchResult;

    const stockInfo = await fetchStockInfo({ id: supplierId, symbol });
    const isin = parseIsin({ html: stockInfo });

    const id = getInstrumentId({ isin });

    return {
      id,
      isin,
      name,
      symbol,
    } as Instrument;
  } catch (err) {
    throw new Error(`Unable to find instrument on morningstar.co.uk: ${symbol}`);
  }
}
