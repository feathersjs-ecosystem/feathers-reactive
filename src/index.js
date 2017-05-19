import {matcher} from 'feathers-commons/lib/utils';
import reactiveResource from './resource';
import reactiveList from './list';
import strategies from './strategies';
import {makeSorter} from './utils';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';

const debug = require('debug')('feathers-reactive');

function FeathersRx (options) {
  const listStrategies = strategies();

  if (!options.idField) {
    console.warn('feathers-reactive: options.idField is not configured and will be set to \'id\' by default. If your db uses a different field like \'_id\', make sure to set idField properly.');
  }

  options = Object.assign({
    idField: 'id',
    dataField: 'data',
    sorter: makeSorter,
    lazy: true,
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
      created: Observable.fromEvent(service, 'created'),
      updated: Observable.fromEvent(service, 'updated'),
      patched: Observable.fromEvent(service, 'patched'),
      removed: Observable.fromEvent(service, 'removed')
    };

    const reactiveMethods = {};

    app.methods.forEach(method => {
      if (typeof service[method] === 'function') {
        reactiveMethods[method] = method === 'find'
          ? reactiveList(events, options)
          : reactiveResource(events, options, method);
      }
    });

    mixin.watch = () => reactiveMethods;

    const newThis = service.mixin(mixin);

    for (let m in reactiveMethods) {
      reactiveMethods[m] = reactiveMethods[m].bind(newThis);
    }
  };

  return function () {
    debug('Initializing feathers-reactive plugin');

    this.mixins.push(mixin);
  };
}

FeathersRx.strategy = strategies;

export default FeathersRx;
