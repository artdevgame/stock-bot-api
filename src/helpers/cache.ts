import { default as dayjs } from 'dayjs';
import fs from 'fs';

import { logger } from './logger';

interface GetCachePath {
  filename: string;
  path: string;
}

interface PruneCache {
  path: string;
}

export enum ContentType {
  JSON = 'application/json',
  TEXT = 'text/plain',
}

export type CacheOptions = GetCachePath & {
  contentType?: ContentType;
};

export type WriteCacheOptions = CacheOptions & {
  purgeDate?: string;
};

const PURGE_FILENAME = '.purgeAt';

function getCachePath({ filename, path }: GetCachePath) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }

  return `${path}/${filename}`;
}

export function pruneCache({ path }: PruneCache) {
  const purgePath = `${path}/${PURGE_FILENAME}`;

  if (fs.existsSync(purgePath)) {
    const purgeAt = fs.readFileSync(purgePath, { encoding: 'utf8' });

    if (dayjs(purgeAt).isBefore(dayjs())) {
      logger.info(`Pruning cache: ${path}`);
      fs.rmSync(path, { recursive: true, force: true });
    }
  }
}

export function readFromCache<CachedValue>({
  contentType = ContentType.JSON,
  filename,
  path,
}: CacheOptions): CachedValue | undefined {
  const cachePath = getCachePath({ filename, path });

  if (fs.existsSync(cachePath)) {
    const contents = fs.readFileSync(cachePath, { encoding: 'utf8' });
    return contentType === ContentType.JSON ? JSON.parse(contents) : contents;
  }
}

export function writeToCache(
  value: unknown,
  {
    contentType = ContentType.JSON,
    filename,
    path,
    purgeDate = dayjs().startOf('month').add(1, 'month').toISOString(),
  }: WriteCacheOptions,
) {
  const cachePath = getCachePath({ filename, path });
  const contents = contentType === ContentType.JSON ? JSON.stringify(value, null, 2) : String(value);

  fs.writeFileSync(cachePath, contents, { encoding: 'utf8', flag: 'w' });
  fs.writeFileSync(`${path}/${PURGE_FILENAME}`, purgeDate, { encoding: 'utf8', flag: 'w' });
}
