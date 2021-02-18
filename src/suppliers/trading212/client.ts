import { NotADividendStockError } from '../../errors/NotADividendStockError';
import { logger } from '../../helpers/logger';
import redis from '../../helpers/redis';
import { Dividend, FetchDividend } from '../types';
import { fetchCompany } from './companies';
import { fetchInstruments } from './instruments';

export async function fetchDividend({ isin }: FetchDividend): Promise<Dividend> {
  const cachedResult = await redis.getAsync(isin);

  if (cachedResult !== null) {
    logger.info(`Using Redis cache: ${isin}`);
    return JSON.parse(cachedResult);
  }

  logger.info(`Fetching instruments from trading212.com`);

  const instruments = await fetchInstruments();

  logger.info(`Filtering trading212.com instruments: ${isin}`);

  const instrument = instruments.find((i) => i.isin === isin);

  if (typeof instrument === 'undefined') {
    throw new Error(`Unable to find instrument on trading212.com: ${isin}`);
  }

  logger.info(`Fetching company information from trading212.com: ${isin}`);

  const company = await fetchCompany({ isin });
  const { keyRatios } = company;
  const { dividendYield } = keyRatios;

  if (dividendYield < 0) {
    throw new NotADividendStockError(`No yield information from trading212.com: ${isin}`);
  }

  const result = {
    dividendYield,
    instrument: {
      name: instrument.prettyName,
      isin,
      symbol: instrument.name,
    },
  };

  await redis.setAsync(isin, JSON.stringify(result));

  logger.info(`Redis cached result: ${isin}`);

  return result;
}

(async () => {
  const dividend = await fetchDividend({ isin: 'CA86730L1094' });
  logger.info(dividend);
  process.exit();
})();
