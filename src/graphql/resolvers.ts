export const resolvers = {
  Query: {
    dividend: async (obj: unknown, { isin }: { isin: string }) => {
      return {
        dividendYield: 0.045,
        isin: 'US7561091049',
        name: 'Realty Income',
        symbol: 'O',
      };
    },
  },
};
