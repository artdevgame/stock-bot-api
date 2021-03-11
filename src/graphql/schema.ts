export const schema = `
  type Dividend {
    dividendYield: Float
  }

  type Instrument {
    id: String
  }

  # "Query" is reserved. It lists all available queries a client can execute
  type Query {
    fetchDividend(id: String!): Dividend
    fetchInstrumentWithIsin(isin: String!): Instrument
    fetchInstrumentWithSymbol(symbol: String!): Instrument
  }
`;
