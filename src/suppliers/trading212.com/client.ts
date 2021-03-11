import { getInstrumentId } from '../';
import { NotADividendStockError } from '../../errors/NotADividendStockError';
import { logger } from '../../helpers/logger';
import { round } from '../../helpers/number';
import {
  Dividend,
  FetchInstrumentWithIsinParams,
  FetchInstrumentWithSymbolParams,
  FetchSupplierDividendParams,
  Instrument,
} from '../types';
import { fetchCompany } from './companies';
import { fetchInstruments } from './instruments';
import { Instrument as SupplierInstrument } from './types';

interface GetPrioritisedInstrument {
  instruments: SupplierInstrument[];
}

function getPrioritisedInstrument({ instruments }: GetPrioritisedInstrument) {
  return instruments
    .filter(Boolean)
    .sort((a, b) => {
      const aIndex = a?.priorityIndex ?? 0;
      const bIndex = b?.priorityIndex ?? 0;

      if (aIndex < bIndex) return -1;

      return aIndex > bIndex ? 1 : 0;
    })
    .shift();
}

export async function fetchDividend({ instrument }: FetchSupplierDividendParams): Promise<Dividend> {
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

export async function fetchInstrumentWithIsin({ isin }: FetchInstrumentWithIsinParams): Promise<Instrument> {
  const instruments = await fetchInstruments();

  logger.info(`Filtering trading212.com instruments: ${isin}`);

  const instrument = getPrioritisedInstrument({
    instruments: instruments.map((i) => (i.isin === isin && i) as SupplierInstrument) ?? [],
  });

  if (typeof instrument === 'undefined') {
    throw new Error(`Unable to find instrument on trading212.com: ${isin}`);
  }

  const id = getInstrumentId({ isin });

  return {
    id,
    isin,
    name: instrument.prettyName,
    symbol: instrument.name,
  };
}

export async function fetchInstrumentWithSymbol({ symbol }: FetchInstrumentWithSymbolParams): Promise<Instrument> {
  logger.info('Reaching code');
  const instruments = await fetchInstruments();

  logger.info(`Filtering trading212.com instruments: ${symbol}`);

  const instrument = getPrioritisedInstrument({
    instruments: instruments.map((i) => (i.name === symbol && i) as SupplierInstrument),
  });

  if (typeof instrument === 'undefined') {
    throw new Error(`Unable to find instrument on trading212.com: ${symbol}`);
  }

  const { isin, prettyName } = instrument;
  const id = getInstrumentId({ isin });

  return {
    id,
    isin,
    name: prettyName,
    symbol,
  };
}
