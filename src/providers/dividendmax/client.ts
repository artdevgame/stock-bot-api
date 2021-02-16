import fetch from 'node-fetch';
import { parse, HTMLElement } from 'node-html-parser';
import { Meta } from './types';
import { round } from '../helpers/number';
import * as cache from '../helpers/cache';

const { ContentType } = cache;

interface Dividend {
  dividendYield: number;
  forecastAccuracy: number;
}

interface FetchDividendsForSymbol {
  symbol: string;
}

interface FetchDividendMeta {
  symbol: string;
}

interface FetchDividend {
  symbol: string;
  name: string;
  urlPath: string;
}

interface ParseDividend {
  dividendInfo: string;
}

function getPercentageValue(el: HTMLElement) {
  const value = round(Number(el.text.replace('%', '')) / 100);
  return isNaN(value) ? 0 : value;
}

async function fetchDividendMeta({ symbol }: FetchDividendMeta): Promise<Meta[]> {
  const cacheOptions = { filename: 'dividend-meta.json', path: `${__dirname}/.cache/${symbol}` };
  const meta = cache.readFromCache<Meta[]>(cacheOptions);

  if (typeof meta !== 'undefined') {
    return meta;
  }

  const companyRes = await fetch(`https://www.dividendmax.com/suggest.json?q=${symbol}`);

  if (!companyRes.ok) {
    throw new Error(`Unable to find company with symbol: ${symbol}`);
  }

  const company = await companyRes.json();

  cache.writeToCache(company, cacheOptions);

  return company;
}

async function fetchDividend({ symbol, name, urlPath }: FetchDividend) {
  const cacheOptions = {
    contentType: ContentType.TEXT,
    filename: 'dividend.html',
    path: `${__dirname}/.cache/${symbol}`,
  };
  const info = cache.readFromCache<string>(cacheOptions);

  if (typeof info !== 'undefined') {
    return info;
  }

  const dividendInfoRes = await fetch(`https://www.dividendmax.com${urlPath}`);

  if (!dividendInfoRes.ok) {
    throw new Error(`Unable to retrieve dividend info: ${name} (${symbol})`);
  }

  const dividendInfo = await dividendInfoRes.text();

  cache.writeToCache(dividendInfo, cacheOptions);

  return dividendInfo;
}

function parseDividend({ dividendInfo }: ParseDividend): Dividend {
  const dividend = {
    dividendYield: 0,
    forecastAccuracy: 0,
  };

  const document = parse(dividendInfo);
  const highlights = document.querySelectorAll('.landing-card');

  const dividendYieldContainer = highlights.find((parent) =>
    parent.querySelector('.mdc-theme--secondary').text.includes('Yield'),
  );
  const forecastAccuracyContainer = highlights.find((parent) =>
    parent.querySelector('.mdc-theme--secondary').text.includes('Accuracy'),
  );

  if (typeof dividendYieldContainer !== 'undefined') {
    dividend.dividendYield = getPercentageValue(dividendYieldContainer.querySelector('.mdc-typography--headline3'));
  }

  if (typeof forecastAccuracyContainer !== 'undefined') {
    dividend.forecastAccuracy = getPercentageValue(
      forecastAccuracyContainer.querySelector('.mdc-typography--headline3'),
    );
  }

  return dividend;
}

export async function fetchDividendsForSymbol({ symbol }: FetchDividendsForSymbol) {
  try {
    const dividendMeta = await fetchDividendMeta({ symbol });
    const company = dividendMeta.find((meta) => meta.ticker === symbol);

    if (typeof company === 'undefined') {
      throw new Error(`Couldn't match dividend on symbol name: ${symbol}`);
    }

    const { name, path: urlPath, ticker } = company;

    if (ticker !== symbol) {
      throw new Error(`Symbol mismatch. Requested: ${symbol}, Received: ${ticker}`);
    }

    const dividendInfo = await fetchDividend({ symbol, name, urlPath });
    return parseDividend({ dividendInfo });
  } catch (err) {
    console.error(err.message);
  }
}
