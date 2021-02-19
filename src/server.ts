import config from 'config';
import fastify from 'fastify';
import rateLimiter from 'fastify-rate-limit';
import Redis from 'ioredis';
import mercurius from 'mercurius';
import { v4 as uuid } from 'uuid';

import * as keyManager from './auth/key-manager';
import { resolvers, schema } from './graphql';
import { createApiKeySchema } from './http/schema';

const app = fastify();

app.addHook('onRequest', (req, reply, done) => {
  if (req.url.includes('/api/key-store')) {
    return done();
  }

  if (!('x-api-key' in req.headers)) {
    throw new Error(`Missing 'x-api-key' from headers`);
  }

  const identity = keyManager.getIdentity(req.headers['x-api-key'] as string);

  if (typeof identity === 'undefined') {
    throw new Error(`Invalid 'x-api-key' provided in headers`);
  }

  if (identity.isBanned) {
    throw new Error(`Access to the API with this key has been revoked`);
  }

  keyManager.updateLastUsed(identity.key);

  return done();
});

app.register(rateLimiter, {
  ban: config.get('server.apiLimit.banAfterMaxHttp429Responses'), // max number of 429 responses before response becomes 403 (context.ban: true)
  errorResponseBuilder: function (req, context) {
    // @ts-ignore https://github.com/fastify/fastify-rate-limit/pull/128
    if (context.ban) {
      keyManager.banKey(req.headers['x-api-key'] as string);
      return {
        statusCode: 403,
        error: 'Banned',
        message: `Access to the API using this key has been revoked (exceeded rate limit continuously)`,
      };
    }

    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${context.after}`,
    };
  },
  keyGenerator: function (req) {
    return req.headers['x-api-key'] as string;
  },
  max: config.get('server.apiLimit.maxRequestsPerMinute'),
  global: true,
  redis: new Redis(process.env.REDIS_URL!),
  timeWindow: '1 minute',
});

app.post('/api/key-store', { schema: { body: createApiKeySchema } }, (req, reply) => {
  const { authKey } = req.body as { authKey: string };
  const genuineAuthKey = config.get('server.authKey') as string;

  if (!genuineAuthKey.trim()) {
    throw new Error(`Set server.authKey in config`);
  }

  if (authKey !== genuineAuthKey) {
    reply.status(401).send(new Error(`Invalid 'authKey' provided in body, can't create API key`));
  }

  reply.send(keyManager.addKey(uuid()));
});

app.register(mercurius, { resolvers, schema, graphiql: true });

async function run() {
  await app.listen(config.get('server.port'), '0.0.0.0');
}

run();
