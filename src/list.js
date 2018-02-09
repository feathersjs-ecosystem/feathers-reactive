import {
  getOptions,
  getSource
} from './utils';

import {
  cacheObservable,
  getCachedObservable
} from './cache';

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

    const letStream = options.let ? stream.pipe(options.let) : stream;

    // set cache and return cached observable
    return cacheObservable(this._cache, 'find', params, letStream);
  };
};
