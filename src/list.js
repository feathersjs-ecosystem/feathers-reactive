import 'rxjs/add/operator/finally';
import 'rxjs/add/operator/shareReplay';

import {
  getOptions,
  getSource,
  cacheObservable,
  getCachedObservable
} from './utils';

module.exports = function (settings) {
  return function (params) {
    const cachedObservable = getCachedObservable(this._cache, 'find', params);

    // return cached Observable if it exists
    if (cachedObservable) {
      return cachedObservable;
    }

    const options = getOptions(settings, this._rx, params.rx);
    const source = getSource(this.find.bind(this), arguments);
    const stream = options.listStrategy.call(this, source, options, arguments);

    const letStream = options.let ? stream.let(options.let) : stream;

    // set cache and return cached observable
    return cacheObservable(this._cache, 'find', params, letStream);
  };
};
