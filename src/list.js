import { promisify, getOptions } from './utils';

export default function(Rx, events, settings) {
  return function (params = {}) {
    const query = Object.assign({}, params.query);
    const args = arguments;
    const __super = this._super;

    let result = null;

    const source = Rx.Observable.create(observer => {
      const _observer = observer;

      if(!result) {
        result = __super.apply(this, arguments);

        // Hack because feathers-query-params deletes stuff from `params.query`
        // Will be fixed in the next version
        params.query = query;
      }

      result.then(res => {
        _observer.next(res);
        _observer.complete();
      })
      .catch(e => _observer.error(e));
    });

    const options = getOptions(settings, this._rx, params.rx);
    const promiseWrapper = {
      then(... args) {
        return source.toPromise().then(... args);
      },

      catch(... args) {
        return source.toPromise().catch(... args);
      }
    };

    return promisify(options.listStrategy.call(this, source, events, options, args), promiseWrapper);
  };
}
