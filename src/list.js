import { promisify, getOptions, fromSuper } from './utils';

export default function(Rx, events, settings) {
  return function (params = {}) {
    if(this._rx === false || params.rx === false) {
      return this._super(... arguments);
    }

    const source = fromSuper(Rx, this._super.bind(this), arguments);
    const options = getOptions(settings, this._rx, params.rx);
    const stream = options.listStrategy.call(this,
      source, events, options, arguments);

    return promisify(stream);
  };
}
