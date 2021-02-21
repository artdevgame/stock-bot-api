import fetch from 'node-fetch';
import { parse, HTMLElement } from 'node-html-parser';

import { NotADividendStockError } from '../../errors/NotADividendStockError';
import * as cache from '../../helpers/cache';
import { logger } from '../../helpers/logger';
import { round } from '../../helpers/number';
import { FetchDividend } from '../types';
import { SearchResult } from './types';

const { ContentType } = cache;

interface Dividend {
  dividendYield: number;
  forecastAccuracy: number;
}

interface FetchSearchResult {
  isin: string;
  symbol: string;
}

interface FetchStockInfo {
  isin: string;
  link: string;
}

interface ParseDividend {
  html: string;
}

function getPercentageValue(el: HTMLElement) {
  const value = round(Number(el.text.replace('%', '')) / 100);
  return isNaN(value) ? 0 : value;
}

async function fetchSearchResult({ isin, symbol }: FetchSearchResult): Promise<SearchResult[]> {
  const cacheOptions = { filename: 'search-result.json', path: `${__dirname}/.cache/${isin}` };

  cache.pruneCache({ path: cacheOptions.path });

  const cachedSearchResult = cache.readFromCache<SearchResult[]>(cacheOptions);

  if (typeof cachedSearchResult !== 'undefined') {
    logger.info(`Using dividendmax.com FS cache (fetchSearchResult): ${isin}`);
    return cachedSearchResult;
  }

  logger.info(`Searching for stock on dividendmax.com: ${isin} (${symbol})`);

  const searchResultRes = await fetch(`https://www.dividendmax.com/suggest.json?q=${symbol}`);

  if (!searchResultRes.ok) {
    throw new Error(`Unable to retrieve search result from dividendmax.com: ${isin} (${symbol})`);
  }

  const searchResult = await searchResultRes.json();

  cache.writeToCache(searchResult, cacheOptions);

  logger.info(`Cached dividendmax.com search result: ${isin}`);

  return searchResult;
}

async function fetchStockInfo({ isin, link }: FetchStockInfo) {
  const cacheOptions = {
    contentType: ContentType.TEXT,
    filename: 'stock-info.html',
    path: `${__dirname}/.cache/${isin}`,
  };

  cache.pruneCache({ path: cacheOptions.path });

  const info = cache.readFromCache<string>(cacheOptions);

  if (typeof info !== 'undefined') {
    logger.info(`Using dividendmax.com FS cache (fetchStockInfo): ${isin}`);
    return info;
  }

  const stockInfoRes = await fetch(`https://www.dividendmax.com${link}`);

  if (!stockInfoRes.ok) {
    throw new Error(`Unable to retrieve stock info from dividendmax.com: ${isin}`);
  }

  const stockInfo = await stockInfoRes.text();

  cache.writeToCache(stockInfo, cacheOptions);

  logger.info(`Cached dividendmax.com stock info page: ${isin}`);

  return stockInfo;
}

function parseDividend({ html }: ParseDividend): Dividend {
  const dividend = {
    dividendYield: 0,
    forecastAccuracy: 0,
  };

  const document = parse(html);
  const highlights = document.querySelectorAll('.landing-card');

  const dividendYieldContainer = highlights.find((parent) =>
    parent.querySelector('.mdc-theme--secondary').text.includes('Yield'),
  );
  const forecastAccuracyContainer = highlights.find((parent) =>
    parent.querySelector('.mdc-theme--secondary').text.includes('Accuracy'),
  );

  if (typeof dividendYieldContainer !== 'undefined') {
    const dividendYield = getPercentageValue(dividendYieldContainer.querySelector('.mdc-typography--headline3'));
    if (isNaN(dividendYield)) {
      throw new NotADividendStockError(`No yield information from investing.com`);
    }
    dividend.dividendYield = dividendYield;
  } else {
    logger.warn(`Unable to find the dividend yield container from dividendmax.com html`);
  }

  if (typeof forecastAccuracyContainer !== 'undefined') {
    dividend.forecastAccuracy = getPercentageValue(
      forecastAccuracyContainer.querySelector('.mdc-typography--headline3'),
    );
  } else {
    logger.warn(`Unable to find the forecast accuracy container from dividendmax.com html`);
  }

  return dividend;
}

export async function fetchDividend({ instrument }: FetchDividend) {
  const { isin, symbol } = instrument;

  logger.info(`Fetching dividend information from dividendmax.com: ${isin}`);

  const searchResults = await fetchSearchResult({ isin, symbol });
  const searchResult = searchResults.find((searchResult) => searchResult.ticker === symbol);

  if (typeof searchResult === 'undefined') {
    throw new Error(`Unable to find instrument on dividendmax.com: ${isin} (${symbol})`);
  }

  const stockInfo = await fetchStockInfo({ isin, link: searchResult.path });
  const dividend = parseDividend({ html: stockInfo });
  const { dividendYield } = dividend;

  return { dividendYield: round(dividendYield, 8) } as Dividend;
}
