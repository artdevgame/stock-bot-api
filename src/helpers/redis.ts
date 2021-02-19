import config from 'config';
import Redis from 'ioredis';

interface SetAsyncOptions {
  ttl: number;
}

export const client = new Redis(process.env.REDIS_URL!);

export function readFromRedis(key: string) {
  return client.get(key);
}

export function writeToRedis(
  key: string,
  value: string,
  options: SetAsyncOptions = {
    ttl: config.get('redis.ttl'),
  },
) {
  if (options.ttl === Infinity) {
    return client.set(key, value);
  }
  return client.set(key, value, 'EX', options.ttl);
}
