import {
  getOptions,
  getSource,
  getParamsPosition,
  getPipeStream
} from './utils';

import {
  cacheObservable,
  getCachedObservable
} from './cache';

import { merge, of } from 'rxjs';

import {
  concat,
  concatMap,
  filter,
  mapTo
} from 'rxjs/operators';

module.exports = function (settings, method) {
  return function () {
    const position = getParamsPosition(method);
    const params = arguments[position] || {};

    const cachedObservable = method === 'get' ? getCachedObservable(this._cache, 'get', /* id */ arguments[0]) : undefined;

    // check if cached Observable exists
    if (cachedObservable) {
      return cachedObservable;
    }

    // create new Observable resource
    const options = getOptions(settings, this._rx, params.rx);
    const source = getSource(this[method].bind(this), arguments);
    const stream = source.pipe(
      concatMap(data => {
        // Filter only data with the same id
        const filterFn = current => current[options.idField] === data[options.idField];
        // `removed` events get special treatment
        const filteredRemoves = this.removed$.pipe(filter(filterFn));
        // `created`, `updated` and `patched`
        const filteredEvents = merge(
          this.created$,
          this.updated$,
          this.patched$
        ).pipe(
          filter(filterFn)
        );

        const combinedEvents = merge(
          // Map to a callback that merges old and new data
          filteredEvents,
          // filtered `removed` events always mapped to `null`
          filteredRemoves.pipe(mapTo(null))
        );

        return of(data).pipe(
          concat(combinedEvents)
        );
      }));

    const pipeStream = getPipeStream(stream, options);

    // if the method is `get` cache the result, otherwise just return the stream
    return method === 'get' ? cacheObservable(this._cache, 'get', /* id */ arguments[0], pipeStream) : pipeStream;
  };
};
