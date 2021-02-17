import redis from 'redis';
import config from 'config';
import { promisify } from 'util';

const client = redis.createClient(process.env.REDIS_URL!);

export default {
  ...client,
  getAsync: promisify(client.get).bind(client),
  setAsync: (key: string, value: string) => promisify(client.setex).bind(client)(key, config.get('redis.ttl'), value),
};
