import fetch from 'node-fetch';

import * as cache from '../../helpers/cache';
import { logger } from '../../helpers/logger';
import { Company } from './types';

interface FetchCompany {
  isin: string;
}

export async function fetchCompany({ isin }: FetchCompany): Promise<Company> {
  const cacheOptions = { filename: `company.json`, path: `${__dirname}/.cache/companies/${isin}` };

  cache.pruneCache({ path: cacheOptions.path });

  const cachedCompany = cache.readFromCache<Company>(cacheOptions);

  if (typeof cachedCompany !== 'undefined') {
    logger.info(`Using trading212.com FS cache (fetchCompany): ${isin}`);
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

  logger.info(`Cached trading212.com company: ${isin}`);

  return company;
}
