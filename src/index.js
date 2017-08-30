import _debug from 'debug';
import { matcher } from 'feathers-commons/lib/utils';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/exhaustMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/let';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mapTo';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/scan';

import reactiveResource from './resource';
import reactiveList from './list';
import strategies from './strategies';
import { makeSorter, getParamsPosition } from './utils';

const debug = _debug('feathers-reactive');

function FeathersRx (options = {}) {
  const listStrategies = strategies();

  if (!options.idField) {
    throw new Error(`feathers-reactive: setting options.idField is mandatory`);
  }

  options = Object.assign({
    dataField: 'data',
    sorter: makeSorter,
    matcher,
    // Whether to requery service when a change is detected
    listStrategy: 'smart',
    listStrategies
  }, options);

  const mixin = function (service) {
    const app = this;

    const events = {
      created: Observable.fromEvent(service, 'created'),
      updated: Observable.fromEvent(service, 'updated'),
      patched: Observable.fromEvent(service, 'patched'),
      removed: Observable.fromEvent(service, 'removed')
    };

    // object to hold our reactive methods
    const reactiveMethods = {};

    const cache = {
      find: {},
      get: {}
    };

    app.methods.forEach(method => {
      if (typeof service[method] === 'function') {
        reactiveMethods[method] = method === 'find'
          ? reactiveList(options)
          : reactiveResource(options, method);
      }
    });

    const mixin = {
      _cache: cache,

      created$: events.created,
      updated$: events.updated,
      patched$: events.patched,
      removed$: events.removed,

      rx (options = {}) {
        this._rx = options;
        return this;
      },
      watch (options = {}) {
        const boundMethods = {};

        Object.keys(reactiveMethods).forEach(method => {
          const position = getParamsPosition(method);

          boundMethods[method] = (...args) => {
            // inject `options` into `params.rx`
            args[position] = Object.assign(args[position] || {}, { rx: options });
            return reactiveMethods[method](...args);
          };
        });

        return boundMethods;
      }
    };

    // get the extended service object
    const newService = service.mixin(mixin);

    // bind the new service to all reactive methods
    for (let method in reactiveMethods) {
      reactiveMethods[method] = reactiveMethods[method].bind(newService);
    }
  };

  return function () {
    debug('Initializing feathers-reactive plugin');

    this.mixins.push(mixin);
  };
}

FeathersRx.strategy = strategies;

module.exports = FeathersRx;
