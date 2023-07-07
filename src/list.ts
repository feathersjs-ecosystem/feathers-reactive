import { cacheObservable, getCachedObservable } from './cache';
import type { Options } from './interfaces';
import { getOptions, getSource, getPipeStream } from './utils';

export function reactiveList(settings: Options) {
  // TODO: `any` type
  return function (params: any) {
    const cachedObservable = getCachedObservable(this._cache, 'find', params);

    // return cached Observable if it exists
    if (cachedObservable) {
      return cachedObservable;
    }

    const options = getOptions(settings, this._rx, params.rx);
    const source = getSource(this.find.bind(this), arguments);
    const stream = options.listStrategy.call(this, source, options, arguments);

    const pipeStream = getPipeStream(stream, options);

    // set cache and return cached observable
    return cacheObservable(this._cache, 'find', params, pipeStream);
  };
}
