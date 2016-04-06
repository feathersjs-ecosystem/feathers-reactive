import Rx from 'rx';
import { promisify } from './utils';
import { sorter as createSorter, matcher } from 'feathers-commons/lib/utils';

export default function(events, options) {
  return function(params) {
    const query = Object.assign({}, params.query);
    const result = this._super.apply(this, arguments);

    if(typeof result.then !== 'function') {
      return result;
    }

    const source = Rx.Observable.fromPromise(result);
    // `updated` and `patched` behave the same
    const updaters = Rx.Observable.merge(events.updated, events.patched);
    // A function that returns if an item matches the query
    const matches = matcher(query);
    // The sort function (if $sort is set)
    const sorter = query.$sort ? createSorter(query.$sort) : null;

    const stream = source.concat(source.flatMapFirst(data =>
      Rx.Observable.merge(
        events.created.filter(matches).map(eventData =>
          items => items.concat(eventData)
        ),
        events.removed.map(eventData =>
          items => items.filter(current => eventData[options.id] !== current[options.id])
        ),
        updaters.map(eventData =>
          items => items.map(current => {
            if(eventData[options.id] === current[options.id]) {
              return options.merge(current, eventData);
            }

            return current;
          }).filter(matches)
        )
      ).scan((current, callback) => {
        const result = callback(current);

        return sorter ? result.sort(sorter) : result;
      }, data)
    ));

    return promisify(stream, result);
  };
}
