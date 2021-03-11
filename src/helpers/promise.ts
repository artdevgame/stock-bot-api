import { NotADividendStockError } from '../errors/NotADividendStockError';

export type DestructuredPromise<ReturnType> = [fn: (params: unknown) => Promise<ReturnType>, params: unknown];

export async function first<ReturnType>(promiseSet: DestructuredPromise<ReturnType>[]): Promise<ReturnType> {
  const promise = promiseSet.shift();

  if (typeof promise === 'undefined') {
    if (promiseSet.length) {
      return await first(promiseSet);
    }
    return Promise.reject('No items in the set returned successfully');
  }

  const [fn, params] = promise;

  try {
    return await fn(params);
  } catch (err) {
    if (promiseSet.length) {
      return await first(promiseSet);
    }
    return Promise.reject('No items in the set returned successfully');
  }
}
