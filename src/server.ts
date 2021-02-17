import fastify from 'fastify';
import config from 'config';
import mercurius from 'mercurius';
import { resolvers, schema } from './graphql';

const app = fastify();

app.register(mercurius, { resolvers, schema, graphiql: true });

async function run() {
  await app.listen(config.get('server.port'), '0.0.0.0');
}

run();
