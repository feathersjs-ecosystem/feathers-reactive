import _debug from 'debug';
import stringify from 'json-stable-stringify';
import type { Observable, TimestampProvider } from 'rxjs';
import { ReplaySubject } from 'rxjs';
import { finalize, multicast, refCount } from 'rxjs/operators';

const debug = _debug('feathers-reactive');

export function cacheObservable<T>(
  cache: any = {},
  method: string,
  key: string,
  observable: Observable<T>
) {
  const hash = _hash(key);

  const cachedObservable = observable.pipe(
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

export function getCachedObservable(
  cache: any = {},
  method: string,
  key: string
) {
  const hash = _hash(key);

  return cache[method][hash];
}

function _hash(key: string) {
  return stringify(key);
}

// eslint:disable
/* We relied on faulty behavior fixed in https://github.com/ReactiveX/rxjs/commit/accbcd0c5f9fd5976be3f491d454c4a61f699c4b.
   This is the old shareReplay that tears down when refCount hits 0 */
function _oldStyleShareReplay(
  bufferSize: number,
  windowTime?: number,
  scheduler?: TimestampProvider
) {
  let subject: ReplaySubject<any>;

  const connectable = multicast(function shareReplaySubjectFactory() {
    if (this._isComplete) {
      return subject;
    } else {
      return (subject = new ReplaySubject(bufferSize, windowTime, scheduler));
    }
  });
  return (source: Observable<any>) => refCount()(connectable(source));
}
