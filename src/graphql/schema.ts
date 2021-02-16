import { gql } from 'apollo-server-fastify';

export const typeDefs = gql`
  type Dividend {
    dividendYield: Float
    isin: String
    name: String
    symbol: String
  }

  # "Query" is reserved. It lists all available queries a client can execute
  type Query {
    dividend: Dividend
  }
`;
