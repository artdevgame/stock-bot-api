import fs from 'fs';
import config from 'config';

interface GetCachePath {
  filename: string;
  path: string;
}

export enum ContentType {
  JSON = 'application/json',
  TEXT = 'text/plain',
}

export type CacheOptions = GetCachePath & {
  contentType?: ContentType;
};

export function getCachePath({ filename, path }: GetCachePath) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }

  return `${path}/${filename}`;
}

export function readFromCache<CachedValue>({
  contentType = ContentType.JSON,
  filename,
  path,
}: CacheOptions): CachedValue | undefined {
  const cachePath = getCachePath({ filename, path });

  if (fs.existsSync(cachePath)) {
    config.get('debug') && console.log('[CACHE HIT]', cachePath);
    const contents = fs.readFileSync(cachePath, { encoding: 'utf8' });
    return contentType === ContentType.JSON ? JSON.parse(contents) : contents;
  }
}

export function writeToCache(value: unknown, { contentType = ContentType.JSON, filename, path }: CacheOptions) {
  const cachePath = getCachePath({ filename, path });
  const contents = contentType === ContentType.JSON ? JSON.stringify(value, null, 2) : String(value);

  fs.writeFileSync(cachePath, contents, { encoding: 'utf8', flag: 'w' });
}
