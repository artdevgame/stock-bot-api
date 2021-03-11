import { fetchDividend, fetchInstrumentWithIsin, fetchInstrumentWithSymbol } from '../suppliers';
import {
  FetchDividendParams,
  FetchInstrumentWithIsinParams,
  FetchInstrumentWithSymbolParams,
} from '../suppliers/types';

export const resolvers = {
  Query: {
    fetchDividend: async (obj: unknown, { id }: FetchDividendParams) => {
      return fetchDividend({ id });
    },

    fetchInstrumentWithIsin: async (obj: unknown, { isin }: FetchInstrumentWithIsinParams) => {
      return fetchInstrumentWithIsin({ isin });
    },

    fetchInstrumentWithSymbol: async (obj: unknown, { symbol }: FetchInstrumentWithSymbolParams) => {
      return fetchInstrumentWithSymbol({ symbol });
    },
  },
};
