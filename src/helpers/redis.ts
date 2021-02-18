import config from 'config';
import redis from 'redis';
import { promisify } from 'util';

interface SetAsyncOptions {
  ttl: number;
}

const client = redis.createClient(process.env.REDIS_URL!);

export default {
  ...client,
  getAsync: promisify(client.get).bind(client),
  setAsync: (
    key: string,
    value: string,
    options: SetAsyncOptions = {
      ttl: config.get('redis.ttl'),
    },
  ) => {
    if (options.ttl === Infinity) {
      return promisify(client.set).bind(client)(key, value);
    }
    return promisify(client.setex).bind(client)(key, options.ttl, value);
  },
};
