import reactiveResource from './resource';
import reactiveList from './list';
import strategies from './strategies';

const debug = require('debug')('feathers-rx');

function FeathersRx(Rx, options) {
  if(!Rx) {
    throw new Error('You have to pass an instance of RxJS as the first paramter.');
  }

  if(!Rx.Observable) {
    throw new Error('The RxJS instance does not seem to provide an `Observable` type.');
  }

  const listStrategies = strategies(Rx);

  options = Object.assign({
    idField: 'id',
    dataField: 'data',
    // Whether to requery service when a change is detected
    listStrategy: 'smart',
    // The merging strategy
    merge(current, eventData) {
      return Object.assign({}, current, eventData);
    }
  }, options);

  if(typeof options.listStrategy === 'string') {
    options.listStrategy = listStrategies[options.listStrategy];
  }

  const mixin = function(service) {
    const app = this;
    const mixin = {
      rx(options = {}) {
        this._rx = options;
        return this;
      }
    };
    const events = {
      created: Rx.Observable.fromEvent(service, 'created'),
      updated: Rx.Observable.fromEvent(service, 'updated'),
      patched: Rx.Observable.fromEvent(service, 'patched'),
      removed: Rx.Observable.fromEvent(service, 'removed')
    };

    app.methods.forEach(method => {
      if(typeof service[method] === 'function') {
        mixin[method] = method === 'find' ? reactiveList(Rx, events, options) :
          reactiveResource(Rx, events, options, method);
      }
    });

    service.mixin(mixin);
  };

  return function() {
    debug('Initializing feathers-rx plugin');

    this.mixins.push(mixin);
  };
}

FeathersRx.strategy = strategies;

export default FeathersRx;
