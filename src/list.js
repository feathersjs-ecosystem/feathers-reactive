import { promisify, getOptions, getSource } from './utils';

export default function(Rx, events, settings) {
  return function (params = {}) {
    const args = arguments;

    if(this._rx === false || params.rx === false) {
      return this._super(... args);
    }

    const options = getOptions(settings, this._rx, params.rx);
    const source = getSource(Rx, options.lazy, this._super.bind(this), arguments);
    const stream = options.listStrategy.call(this, source, events, options, args);

    return promisify(stream);
  };
}
