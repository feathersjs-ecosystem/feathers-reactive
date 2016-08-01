import { promisify } from './utils';

export default function(Rx, events, options) {
  return function (params = {}) {
    const query = Object.assign({}, params.query);
    const args = arguments;

    const __super = this._super;

    let result;

    const source = Rx.Observable.create(observer => {
      const _observer = observer;

      result = __super.apply(this, arguments)
        .then(res => {
          _observer.next(res);
          _observer.complete();
        })
        .catch(e => _observer.error(e));
    });

    // Hack because feathers-query-params deletes stuff from `params.query`
    // Will be fixed in the next version
    params.query = query;

    options = Object.assign(options, this._rx, params.rx);

    return promisify(options.listStrategy.call(this, source, events, options, args), source.toPromise());
  };
}
