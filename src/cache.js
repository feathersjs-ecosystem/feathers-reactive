import stringify from 'json-stable-stringify';
import { ReplaySubject } from 'rxjs';
import { finalize, multicast, refCount } from 'rxjs/operators';

import _debug from 'debug';
const debug = _debug('feathers-reactive');

function cacheObservable (cache, method, key, observable) {
  const hash = _hash(key);

  const cachedObservable = observable
    .pipe(
      finalize(() => {
        // clean cache on unsubscription (of all observers)
        debug('removing cache item: ', hash);

        delete cache[method][hash];
      }),
      _oldStyleShareReplay(1)
    );

  cache[method][hash] = cachedObservable;

  return cache[method][hash];
}

function getCachedObservable (cache, method, key) {
  const hash = _hash(key);

  return cache[method][hash];
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
  cacheObservable,
  getCachedObservable
});
