export const resolvers = {
  Query: {
    dividend: () => ({
      dividendYield: 0.045,
      isin: 'US7561091049',
      name: 'Realty Income',
      symbol: 'O',
    }),
  },
};
