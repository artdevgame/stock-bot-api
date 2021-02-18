import fetch from 'node-fetch';

import * as cache from '../../helpers/cache';
import { logger } from '../../helpers/logger';
import { Instrument } from './types';

export async function fetchInstruments() {
  const cacheOptions = { filename: `instruments.json`, path: `${__dirname}/.cache/instruments` };

  cache.pruneCache({ path: cacheOptions.path });

  const cachedInstrument = cache.readFromCache<Instrument[]>(cacheOptions);

  if (typeof cachedInstrument !== 'undefined') {
    logger.info(`Using trading212.com FS cache (fetchInstruments)`);
    return cachedInstrument;
  }

  const instrumentRes = await fetch(`https://live.trading212.com/rest/instruments`);

  if (!instrumentRes.ok) {
    throw new Error(`Unable to fetch all instruments from T212`);
  }

  const instruments: Instrument[] = await instrumentRes.json();

  cache.writeToCache(instruments, cacheOptions);

  logger.info(`Cached trading212.com instruments`);

  return instruments;
}
