import * as cache from '../helpers/cache';
import fetch from 'node-fetch';
import { Company } from './types';

interface FetchCompany {
  isin: string;
}

export async function fetchCompany({ isin }: FetchCompany) {
  const cacheOptions = { filename: `${isin}.json`, path: `${__dirname}/.cache/companies` };
  const cachedCompany = cache.readFromCache<Company>(cacheOptions);

  if (typeof cachedCompany !== 'undefined') {
    return cachedCompany;
  }

  const companyRes = await fetch(
    `https://live.trading212.com/rest/companies/fundamentals?languageCode=en&isin=${isin}`,
  );

  if (!companyRes.ok) {
    throw new Error(`Unable to retrieve company fundamentals from T212 with ISIN: ${isin}`);
  }

  const company: Company = await companyRes.json();

  cache.writeToCache(company, cacheOptions);

  return company;
}
