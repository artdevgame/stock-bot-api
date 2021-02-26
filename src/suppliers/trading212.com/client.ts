import { NotADividendStockError } from '../../errors/NotADividendStockError';
import { logger } from '../../helpers/logger';
import { round } from '../../helpers/number';
import { Dividend, FetchDividend, FetchInstrumentWithIsin, FetchInstrumentWithSymbol, Instrument } from '../types';
import { fetchCompany } from './companies';
import { fetchInstruments } from './instruments';

export async function fetchDividend({ instrument }: FetchDividend): Promise<Dividend> {
  const { isin } = instrument;

  logger.info(`Fetching dividend information from trading212.com: ${isin}`);

  const company = await fetchCompany({ isin });
  const { keyRatios } = company;
  const { dividendYield } = keyRatios;

  if (dividendYield < 0) {
    throw new NotADividendStockError(`No yield information from trading212.com: ${isin}`);
  }

  return { dividendYield: round(dividendYield / 100, 8) };
}

export async function fetchInstrumentWithIsin({ isin }: FetchInstrumentWithIsin): Promise<Instrument> {
  const instruments = await fetchInstruments();

  logger.info(`Filtering trading212.com instruments: ${isin}`);

  const instrument = instruments.find((i) => i.isin === isin && !i.priorityIndex);

  if (typeof instrument === 'undefined') {
    throw new Error(`Unable to find instrument on trading212.com: ${isin}`);
  }

  return {
    isin,
    name: instrument.prettyName,
    symbol: instrument.name,
  };
}

export async function fetchInstrumentWithSymbol({ symbol }: FetchInstrumentWithSymbol): Promise<Instrument> {
  const instruments = await fetchInstruments();

  logger.info(`Filtering trading212.com instruments: ${symbol}`);

  const instrument = instruments.find((i) => i.name === symbol);

  if (typeof instrument === 'undefined') {
    throw new Error(`Unable to find instrument on trading212.com: ${symbol}`);
  }

  return {
    isin: instrument.isin,
    name: instrument.prettyName,
    symbol,
  };
}
