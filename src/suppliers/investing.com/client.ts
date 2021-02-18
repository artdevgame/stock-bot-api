import FormData from 'form-data';
import fetch from 'node-fetch';
import { parse, HTMLElement } from 'node-html-parser';

import { NotADividendStockError } from '../../errors/NotADividendStockError';
import * as cache from '../../helpers/cache';
import { logger } from '../../helpers/logger';
import { default as redis } from '../../helpers/redis';
import { Dividend, FetchDividend } from '../types';
import { SearchResults, Quote } from './types';

const { ContentType } = cache;

interface FetchInstrument {
  isin: string;
}

interface FetchStockInfo {
  isin: string;
  searchResult: Quote;
}

interface ParseDividend {
  html: string;
}

async function fetchStockInfo({ isin, searchResult }: FetchStockInfo) {
  const { link, name, symbol } = searchResult;

  const cacheOptions = {
    contentType: ContentType.TEXT,
    filename: `stock-info.html`,
    path: `${__dirname}/.cache/${isin}`,
  };
  const info = cache.readFromCache<string>(cacheOptions);

  if (typeof info !== 'undefined') {
    logger.info(`Using investing.com FS cache (fetchStockInfo): ${name} (${symbol})`);
    return info;
  }

  const stockInfoRes = await fetch(`https://uk.investing.com${link}`);

  if (!stockInfoRes.ok) {
    throw new Error(`Unable to retrieve stock info from investing.com: ${name} (${symbol})`);
  }

  const stockInfo = await stockInfoRes.text();

  cache.writeToCache(stockInfo, cacheOptions);

  logger.info(`Cached investing.com stock info page: ${name} (${symbol})`);

  return stockInfo;
}

async function fetchSearchResult({ isin }: FetchInstrument): Promise<Quote> {
  const cacheOptions = { filename: `search-result.json`, path: `${__dirname}/.cache/${isin}` };
  const quote = cache.readFromCache<Quote>(cacheOptions);

  if (typeof quote !== 'undefined') {
    logger.info(`Using investing.com FS cache (fetchSearchResult): ${isin}`);
    return quote;
  }

  logger.info(`Searching for stock on investing.com: ${isin}`);

  const data = new FormData();
  data.append('search_text', isin);

  const searchResultsRes = await fetch(`https://uk.investing.com/search/service/searchTopBar`, {
    method: 'post',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...data.getHeaders(),
    },
    body: data,
  });

  if (!searchResultsRes.ok) {
    throw new Error(`Unable to fetch stock quote from investing.com: ${isin}`);
  }

  const responseBody = await searchResultsRes.text();
  const searchResults = JSON.parse(responseBody) as SearchResults;
  const { quotes, total } = searchResults;

  if (!total.allResults) {
    throw new Error(`Quote not found: ${isin}`);
  }

  cache.writeToCache(quotes[0], cacheOptions);

  logger.info(`Cached investing.com search result: ${isin}`);

  return quotes[0];
}

function getDividendYield(el: HTMLElement) {
  const { text } = el;

  const value = text.includes('(') ? text.replace(/.*\((\d.+)\%\)/, '$1') : text.replace('%', '');
  return Number(value) / 100;
}

function parseDividend({ html }: ParseDividend) {
  const dividend = {
    dividendYield: 0,
  };

  const document = parse(html);
  const dataTable = document.querySelectorAll('.inlineblock');

  const dividendYieldContainer = dataTable.find((parent) => {
    return parent.querySelector('.float_lang_base_1')?.text.includes('Yield');
  });

  if (typeof dividendYieldContainer !== 'undefined') {
    const dividendYield = getDividendYield(dividendYieldContainer.querySelector('.float_lang_base_2'));
    if (!isNaN(dividendYield)) {
      throw new NotADividendStockError(`No yield information from investing.com`);
    }
    dividend.dividendYield = dividendYield;
  } else {
    logger.warn(`Unable to find the dividend yield container from investing.com html`);
  }

  return dividend;
}

export async function fetchDividend({ isin }: FetchDividend): Promise<Dividend> {
  const cachedResult = await redis.getAsync(isin);

  if (cachedResult !== null) {
    logger.info(`Using Redis cache: ${isin}`);
    return JSON.parse(cachedResult);
  }

  logger.info(`Fetching dividend info from investing.com: ${isin}`);

  cache.pruneCache({ path: `${__dirname}/.cache/${isin}` });

  const searchResult = await fetchSearchResult({ isin });
  const instrument = {
    isin,
    name: searchResult.name,
    symbol: searchResult.symbol,
  };

  const stockInfo = await fetchStockInfo({ isin, searchResult });
  const dividend = parseDividend({ html: stockInfo });
  const result = { ...dividend, instrument };

  await redis.setAsync(isin, JSON.stringify(result));

  logger.info(`Redis cached result: ${isin}`);

  return result;
}

(async () => {
  const dividend = await fetchDividend({ isin: 'CA86730L1094' });
  logger.info(dividend);
  process.exit();
})();
