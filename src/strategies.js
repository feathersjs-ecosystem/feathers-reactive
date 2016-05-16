import Rx from 'rxjs/Rx';
import { matcher } from 'feathers-commons/lib/utils';
import { makeSorter } from './utils';

export default {
  never(source) {
    return source;
  },

  always(source, events, options, args) {
    const params = args[0] || {};
    const query = Object.assign({}, params.query);
    const _super = this._super.bind(this);

    // A function that returns if an item matches the query
    const matches = matcher(query);
    // A function that sorts a limits a result (paginated or not)
    const sortAndTrim = makeSorter(query, options);

    return source.concat(source.exhaustMap(() =>
      Rx.Observable.merge(
        events.created.filter(matches),
        events.removed,
        Rx.Observable.merge(events.updated, events.patched)
      ).flatMap(() => {
        const result = _super(...args);
        const source = Rx.Observable.fromPromise(result);

        return source.map(sortAndTrim);
      })
    ));
  },

  smart(source, events, options, args) {
    const params = args[0] || {};
    const query = Object.assign({}, params.query);
    // A function that returns if an item matches the query
    const matches = matcher(query);
    // A function that sorts a limits a result (paginated or not)
    const sortAndTrim = makeSorter(query, options);

    return source.concat(source.exhaustMap(data =>
      Rx.Observable.merge(
        events.created.filter(matches).map(eventData =>
          items => items.concat(eventData)
        ),
        events.removed.map(eventData =>
          items => items.filter(current =>
            eventData[options.idField] !== current[options.idField]
          )
        ),
        Rx.Observable.merge(events.updated, events.patched).map(eventData =>
          items => items.map(current => {
            if(eventData[options.idField] === current[options.idField]) {
              return options.merge(current, eventData);
            }

            return current;
          }).filter(matches)
        )
      ).scan((current, callback) => {
        const isPaginated = !!current[options.dataField];
        if (isPaginated) {
          current[options.dataField] = callback(current.data);
        } else {
          current = callback(current);
        }
        return sortAndTrim(current);
      }, data)
    ));
  }
};
