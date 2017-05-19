import { promisify, getOptions, getSource } from './utils';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/merge';

// The position of the params parameters for a service method so that we can extend them
// default is 1
export const paramsPositions = {
  update: 2,
  patch: 2
};

export default function (events, settings, method) {
  return function () {
    const args = arguments;
    let position = typeof paramsPositions[method] !== 'undefined' ? paramsPositions[method] : 1;
    let params = arguments[position] || {};

    if (this._rx === false || params.rx === false) {
      return this._super(...args);
    }

    const options = getOptions(settings, this._rx, params.rx);
    const source = getSource(options.lazy, this[method].bind(this), args);
    const stream = source.concat(source.exhaustMap(data => {
      // Filter only data with the same id
      const filter = current => current[options.idField] === data[options.idField];
      // `removed` events get special treatment
      const filteredRemoves = events.removed.filter(filter);
      // `created`, `updated` and `patched`
      const filteredEvents = Observable.merge(
        events.created,
        events.updated,
        events.patched
      ).filter(filter);

      return Observable.merge(
        // Map to a callback that merges old and new data
        filteredEvents,
        // filtered `removed` events always map to a function that returns `null`
        filteredRemoves.map(() => null)
      );
    }));

    return promisify(stream);
  };
}
