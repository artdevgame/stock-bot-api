export const schema = `
  type Dividend {
    dividendYield: Float
  }

  type Instrument {
    isin: String
    name: String
    symbol: String
  }

  input InstrumentParam {
    isin: String!
    name: String!
    symbol: String!
  }

  # "Query" is reserved. It lists all available queries a client can execute
  type Query {
    fetchDividend(instrument: InstrumentParam): Dividend
    fetchInstrumentWithIsin(isin: String!): Instrument
    fetchInstrumentWithSymbol(symbol: String!): Instrument
  }
`;
