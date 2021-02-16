import * as redis from 'async-redis';

export const client = redis.createClient(process.env.REDIS_URL!);
