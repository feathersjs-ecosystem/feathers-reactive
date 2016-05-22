import { promisify } from './utils';

export default function(Rx, events, options) {
  return function (params = {}) {
    const query = Object.assign({}, params.query);
    const result = this._super.apply(this, arguments);
    const args = arguments;

    // Hack because feathers-query-params deletes stuff from `params.query`
    // Will be fixed in the next version
    params.query = query;

    if(this._rx === false || params.rx === false || typeof result.then !== 'function') {
      return result;
    }

    options = Object.assign(options, this._rx, params.rx);

    const source = Rx.Observable.fromPromise(result);

    return promisify(
      options.listStrategy.call(this, source, events, options, args),
      result
    );
  };
}
