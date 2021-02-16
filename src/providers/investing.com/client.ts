import fetch from 'node-fetch';
import { SearchResults, Quote } from './types';
import * as cache from '../helpers/cache';
import { parse, HTMLElement } from 'node-html-parser';
import FormData from 'form-data';

const { ContentType } = cache;

interface Dividend {
  dividendYield: number;
}

interface FetchDividend {
  isin: string;
}

interface FetchStockQuote {
  isin: string;
}

interface FetchStockInfo {
  isin: string;
}

interface ParseDividend {
  info: string;
}

async function fetchStockInfo({ isin }: FetchStockInfo) {
  const cacheOptions = {
    contentType: ContentType.TEXT,
    filename: 'stock.html',
    path: `${__dirname}/.cache/${isin}`,
  };
  const info = cache.readFromCache<string>(cacheOptions);

  if (typeof info !== 'undefined') {
    return info;
  }

  const quote = await fetchStockQuote({ isin });
  const { name, symbol } = quote;

  const stockInfoRes = await fetch(`https://uk.investing.com${quote.link}`);

  if (!stockInfoRes.ok) {
    throw new Error(`Unable to retrieve stock info from investing.com: ${name} (${symbol})`);
  }

  const stockInfo = await stockInfoRes.text();

  cache.writeToCache(stockInfo, cacheOptions);

  return stockInfo;
}

async function fetchStockQuote({ isin }: FetchStockQuote) {
  const cacheOptions = { filename: 'quote.json', path: `${__dirname}/.cache/${isin}` };
  const quote = cache.readFromCache<Quote>(cacheOptions);

  if (typeof quote !== 'undefined') {
    return quote;
  }

  const data = new FormData();
  data.append('search_results', isin);

  console.log(data);

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

  console.log({ responseBody });

  /*

  const searchResults = JSON.parse(responseBody) as SearchResults;
  const { quotes, total } = searchResults;

  if (!total.allResults) {
    throw new Error(`Quote not found: ${isin}`);
  }

  cache.writeToCache(quotes[0], cacheOptions);

  return quotes[0];
  */

  process.exit(0);
}

function parseDividend({ info }: ParseDividend): Dividend {
  const dividend = {
    dividendYield: 0,
  };

  const document = parse(info);
  const dataTable = document.querySelectorAll('.overviewDataTable');

  // const dividendYieldContainer = dataTable.find((parent) =>
  //   parent.querySelector('.float_lang_base_1').text.includes('Yield'),
  // );

  // if (typeof dividendYieldContainer !== 'undefined') {
  //   dividend.dividendYield = getPercentageValue(dividendYieldContainer.querySelector('float_lang_base_2'));
  // }

  console.log(dataTable.toString());

  return dividend;
}

export async function fetchDividend({ isin }: FetchDividend) {
  const info = await fetchStockInfo({ isin });
  // const dividend = parseDividend({ info });
}

fetchStockQuote({ isin: 'CA7800871021' });
