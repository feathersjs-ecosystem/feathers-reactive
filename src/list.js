import Rx from 'rxjs/Rx';
import 'rxjs/add/operator/exhaustMap';

import { promisify } from './utils';
import { sorter as createSorter, matcher } from 'feathers-commons/lib/utils';

function List (events, options) {

  return function (params) {
    const query = Object.assign({}, params.query);
    const result = this._super.apply(this, arguments);
    const inputArgs = arguments;

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

    let stream;

    if (options.strategy === List.strategy.never) {
      stream = source.concat(source.exhaustMap(data =>
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
    } else if (options.strategy === List.strategy.always) {
      stream = source.concat(source.exhaustMap(() =>
        Rx.Observable.merge(
          events.created.filter(matches),
          events.removed,
          updaters
        ).flatMap(() => {
          return Rx.Observable.fromPromise(this.find.apply(this, inputArgs)).map((result) => {
            return sorter ? result.sort(sorter) : result;
          });
        })
      ));
    } else {
      throw 'Unsupported feathers-rx strategy type.';
    }

    return promisify(stream, result);
  };
}

List.strategy = {
  always: {},
  never: {},
  // TODO: Jack
  // smart: {}
};

export default List;
