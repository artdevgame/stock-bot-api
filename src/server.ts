import * as fastify from 'fastify';
import config from 'config';
import { ApolloServer } from 'apollo-server-fastify';
import { typeDefs, resolvers } from './graphql';

const server = new ApolloServer({ resolvers, typeDefs });

const app = fastify.default();

async function run() {
  app.register(server.createHandler());
  await app.listen(config.get('server.port'));
}

run();
