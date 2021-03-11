import FormData from 'form-data';
import fetch from 'node-fetch';
import { parse, HTMLElement } from 'node-html-parser';

import { getInstrumentId } from '..';
import { NotADividendStockError } from '../../errors/NotADividendStockError';
import * as cache from '../../helpers/cache';
import { logger } from '../../helpers/logger';
import { round } from '../../helpers/number';
import { Dividend, FetchInstrumentWithIsinParams, FetchSupplierDividendParams, Instrument } from '../types';
import { SearchResults, Quote } from './types';

const { ContentType } = cache;

interface FetchSearchResult {
  isin: string;
}

interface FetchStockInfo {
  isin: string;
  link: string;
}

interface ParseDividend {
  html: string;
}

async function fetchSearchResult({ isin }: FetchSearchResult): Promise<Quote> {
  const cacheOptions = { filename: `search-result.json`, path: `${__dirname}/.cache/${isin}` };

  cache.pruneCache({ path: cacheOptions.path });

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

async function fetchStockInfo({ isin, link }: FetchStockInfo) {
  const cacheOptions = {
    contentType: ContentType.TEXT,
    filename: `stock-info.html`,
    path: `${__dirname}/.cache/${isin}`,
  };

  cache.pruneCache({ path: cacheOptions.path });

  const info = cache.readFromCache<string>(cacheOptions);

  if (typeof info !== 'undefined') {
    logger.info(`Using investing.com FS cache (fetchStockInfo): ${isin}`);
    return info;
  }

  const stockInfoRes = await fetch(`https://uk.investing.com${link}`);

  if (!stockInfoRes.ok) {
    throw new Error(`Unable to retrieve stock info from investing.com: ${isin}`);
  }

  const stockInfo = await stockInfoRes.text();

  cache.writeToCache(stockInfo, cacheOptions);

  logger.info(`Cached investing.com stock info page: ${isin}`);

  return stockInfo;
}

function getDividendYield(el: HTMLElement) {
  const { text } = el;

  const value = text.includes('(') ? text.replace(/.*\((\d.+)\%\)/, '$1') : text.replace('%', '');
  return round(Number(value) / 100, 8);
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
    if (isNaN(dividendYield)) {
      throw new NotADividendStockError(`No yield information from investing.com`);
    }
    dividend.dividendYield = dividendYield;
  } else {
    logger.warn(`Unable to find the dividend yield container from investing.com html`);
  }

  return dividend;
}

export async function fetchDividend({ instrument }: FetchSupplierDividendParams) {
  const { isin } = instrument;

  logger.info(`Fetching dividend information from investing.com: ${isin}`);

  const searchResult = await fetchSearchResult({ isin });
  const stockInfo = await fetchStockInfo({ isin, link: searchResult.link });
  const dividend = parseDividend({ html: stockInfo });
  const { dividendYield } = dividend;

  return { dividendYield } as Dividend;
}

export async function fetchInstrumentWithIsin({ isin }: FetchInstrumentWithIsinParams) {
  try {
    logger.info(`Fetching instrument from investing.com: ${isin}`);
    const searchResult = await fetchSearchResult({ isin });
    const { name, symbol } = searchResult;

    const id = getInstrumentId({ isin });

    return {
      id,
      isin,
      name,
      symbol,
    } as Instrument;
  } catch (err) {
    throw new Error(`Unable to find instrument on investing.com: ${isin}`);
  }
}
