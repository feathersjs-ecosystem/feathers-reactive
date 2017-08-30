import { Observable } from 'rxjs/Observable';
import {
  getOptions,
  getSource,
  cacheObservable,
  getCachedObservable,
  getParamsPosition
} from './utils';

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
    const stream = source.concat(
      source.exhaustMap(data => {
        // Filter only data with the same id
        const filter = current => current[options.idField] === data[options.idField];
        // `removed` events get special treatment
        const filteredRemoves = this.removed$.filter(filter);
        // `created`, `updated` and `patched`
        const filteredEvents = Observable.merge(
          this.created$,
          this.updated$,
          this.patched$
        ).filter(filter);

        return Observable.merge(
          // Map to a callback that merges old and new data
          filteredEvents,
          // filtered `removed` events always mapped to `null`
          filteredRemoves.mapTo(null)
        );
      }));

    // apply `let` function if set
    const letStream = options.let ? stream.let(options.let) : stream;

    // if the method is `get` cache the result, otherwise just return the stream
    return method === 'get' ? cacheObservable(this._cache, 'get', /* id */ arguments[0], letStream) : letStream;
  };
};
