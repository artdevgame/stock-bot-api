import fetch from 'node-fetch';
import * as cache from '../helpers/cache';
import { Instrument } from './types';

interface FetchInstrument {
  code: string;
}

export async function fetchInstrument({ code }: FetchInstrument) {
  const cacheOptions = { filename: `${code}.json`, path: `${__dirname}/.cache/instruments` };
  const cachedInstrument = cache.readFromCache<Instrument>(cacheOptions);

  if (typeof cachedInstrument !== 'undefined') {
    return cachedInstrument;
  }

  const instrumentRes = await fetch(`https://live.trading212.com/rest/instruments/${code}`);

  if (!instrumentRes.ok) {
    throw new Error(`Unable to fetch instrument from T212: ${code}`);
  }

  const instrumentBody = await instrumentRes.text();

  if (!instrumentBody.length) {
    throw new Error(`Instrument not found with T212 code: ${code}`);
  }

  const instrument: Instrument = JSON.parse(instrumentBody);

  cache.writeToCache(instrument, cacheOptions);

  return instrument;
}
