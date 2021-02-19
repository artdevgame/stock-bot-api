import { fetchDividend, fetchInstrumentWithIsin, fetchInstrumentWithSymbol } from '../suppliers';
import { FetchDividend, FetchInstrumentWithIsin, FetchInstrumentWithSymbol } from '../suppliers/types';

export const resolvers = {
  Query: {
    fetchDividend: async (obj: unknown, { instrument }: FetchDividend) => {
      return fetchDividend({ instrument });
    },

    fetchInstrumentWithIsin: async (obj: unknown, { isin }: FetchInstrumentWithIsin) => {
      return fetchInstrumentWithIsin({ isin });
    },

    fetchInstrumentWithSymbol: async (obj: unknown, { symbol }: FetchInstrumentWithSymbol) => {
      return fetchInstrumentWithSymbol({ symbol });
    },
  },
};
