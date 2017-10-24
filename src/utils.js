import _debug from 'debug';
import { sorter as createSorter } from 'feathers-commons/lib/utils';

import { defer } from 'rxjs/observable/defer';
import {
  finalize,
  multicast,
  refCount
} from 'rxjs/operators';

import { ReplaySubject } from 'rxjs/ReplaySubject';

import stringify from 'json-stable-stringify';

const debug = _debug('feathers-reactive');

function getSource (originalMethod, args) {
  return defer(() => originalMethod(...args));
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
    .pipe(
     //  tap(() => console.log('sub'), () => console.log('err'), () => console.log('unsub')),
      finalize(() => {
        // clean cache on unsubscription (of all observers)
        debug('removing cache item: ', hash);
        /// console.log('removing cache item: ', hash);
        delete cache[method][hash];
      }),
      _oldStyleShareReplay(1)
    );

  cache[method][hash] = cachedObservable;

//  console.log('cached:', hash);

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

function _hash (key) {
  return stringify(key);
}

// eslint:disable
/* We relied on faulty behavior fixed in https://github.com/ReactiveX/rxjs/commit/accbcd0c5f9fd5976be3f491d454c4a61f699c4b.
   This is the old shareReplay that tears down when refCount hits 0 */
function _oldStyleShareReplay (bufferSize, windowTime, scheduler) {
  let subject;

  const connectable = multicast(function shareReplaySubjectFactory () {
    if (this._isComplete) {
      return subject;
    } else {
      return (subject = new ReplaySubject(bufferSize, windowTime, scheduler));
    }
  });
  return (source) => refCount()(connectable(source));
}

Object.assign(exports, {
  getSource,
  makeSorter,
  getOptions,
  cacheObservable,
  getCachedObservable,
  getParamsPosition
});
