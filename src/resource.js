import Rx from 'rx';
import { promisify } from './utils';

export default function(events, options) {
  return function() {
    const result = this._super.apply(this, arguments);

    // We only support promises
    if(typeof result.then !== 'function') {
      return result;
    }

    const source = Rx.Observable.fromPromise(result);
    const stream = source.concat(source.flatMapFirst(data => {
      // Filter only data with the same id
      const filter = current => current[options.id] === data[options.id];
      // `removed` events get special treatment
      const filteredRemoves = events.removed.filter(filter);
      // `created`, `updated` and `patched`
      const filteredEvents = Rx.Observable.merge(
          events.created,
          events.updated,
          events.patched
        ).filter(filter);

      return Rx.Observable.merge(
        // Map to a callback that merges old and new data
        filteredEvents.map(newItem =>
          oldItem => options.merge(oldItem, newItem)
        ),
        // filtered `removed` events always map to a function that returns `null`
        filteredRemoves.map(() => () => null)
      ).scan((current, callback) => callback(current), data);
    }));

    return promisify(stream, result);
  };
}
