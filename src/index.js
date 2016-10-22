import {matcher} from 'feathers-commons/lib/utils';
import reactiveResource from './resource';
import reactiveList from './list';
import strategies from './strategies';
import {makeSorter} from './utils';

const debug = require('debug')('feathers-reactive');

function FeathersRx (Rx, options) {
  if (!Rx) {
    throw new Error('You have to pass an instance of RxJS as the first paramter.');
  }

  if (!Rx.Observable) {
    throw new Error('The RxJS instance does not seem to provide an `Observable` type.');
  }

  const listStrategies = strategies(Rx);

  options = Object.assign({
    idField: 'id',
    dataField: 'data',
    sorter: makeSorter,
    lazy: false,
    matcher,
    // Whether to requery service when a change is detected
    listStrategy: 'smart',
    listStrategies
  }, options);

  const mixin = function (service) {
    const app = this;
    const mixin = {
      rx (options = {}) {
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
      if (typeof service[method] === 'function') {
        mixin[method] = method === 'find' ? reactiveList(Rx, events, options)
          : reactiveResource(Rx, events, options, method);
      }
    });

    service.mixin(mixin);
  };

  return function () {
    debug('Initializing feathers-reactive plugin');

    this.mixins.push(mixin);
  };
}

FeathersRx.strategy = strategies;

export default FeathersRx;
