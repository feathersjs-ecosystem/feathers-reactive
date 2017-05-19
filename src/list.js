import { getOptions, getSource } from './utils';

export default function (events, settings) {
  return function (params = {}) {
    const args = arguments;

    if (this._rx === false || params.rx === false) {
      return this._super(...args);
    }

    const options = getOptions(settings, this._rx, params.rx);
    const source = getSource(this.find.bind(this), arguments);
    const stream = options.listStrategy.call(this, source, events, options, args);

    return stream;
  };
}
