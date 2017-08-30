import _debug from 'debug';
import { sorter as createSorter } from 'feathers-commons/lib/utils';
import { Observable } from 'rxjs/Observable';
import stringify from 'json-stable-stringify';

const debug = _debug('feathers-reactive');

function getSource (originalMethod, args) {
  let resultPromise = null;

  return Observable.create(observer => {
    if (!resultPromise) {
      resultPromise = originalMethod(...args);
      _assertPromise(resultPromise);
    }

    resultPromise
      .then(res => {
        observer.next(res);
        observer.complete();
      })
      .catch(e => observer.error(e));
  });
}

function makeSorter (query, options) {
  // The sort function (if $sort is set)
  const sorter = query.$sort ? createSorter(query.$sort) : createSorter({
    [options.idField]: 1
  });

  return function (result) {
    const isPaginated = !!result[options.dataField];
    let data = isPaginated ? result[options.dataField] : result;

    if (sorter) {
      data = data.sort(sorter);
    }

    const limit = typeof result.limit === 'number' ? result.limit : parseInt(query.$limit, 10);

    if (limit && !isNaN(limit)) {
      data = data.slice(0, limit);
    }

    if (isPaginated) {
      result[options.dataField] = data;
    } else {
      result = data;
    }

    return result;
  };
}

function getOptions (base, ...others) {
  const options = Object.assign({}, base, ...others);

  if (typeof options.listStrategy === 'string') {
    options.listStrategy = options.listStrategies[options.listStrategy];
  }

  return options;
}

function cacheObservable (cache, method, key, observable) {
  const hash = _hash(key);

  const cachedObservable = observable
    .finally(() => {
      // clean cache on unsubscription (of all observers)
      debug('removing cache item: ', hash);
      delete cache[method][hash];
    })
    .shareReplay(1);

  cache[method][hash] = cachedObservable;

  return cache[method][hash];
}

function getCachedObservable (cache, method, key) {
  const hash = _hash(key);

  return cache[method][hash];
}

function getParamsPosition (method) {
  // The position of the params parameters for a service method so that we can extend them
  // default is 1

  const paramsPositions = {
    find: 0,
    update: 2,
    patch: 2
  };

  return (method in paramsPositions) ? paramsPositions[method] : 1;
}

function _assertPromise (obj) {
  if (
    !obj ||
    typeof obj.then !== 'function' ||
    typeof obj.catch !== 'function'
  ) {
    throw new Error(`feathers-reactive only works with services that return a Promise`);
  }
}

function _hash (key) {
  return stringify(key);
}

Object.assign(exports, {
  getSource,
  makeSorter,
  getOptions,
  cacheObservable,
  getCachedObservable,
  getParamsPosition
});
