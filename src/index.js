import _debug from 'debug';

import { fromEvent } from 'rxjs/observable/fromEvent';
import reactiveResource from './resource';
import reactiveList from './list';
import strategies from './strategies';
import { makeSorter, getParamsPosition, siftMatcher } from './utils';

const debug = _debug('feathers-reactive');

function FeathersRx (options = {}) {
  const listStrategies = strategies();

  if (!options.idField) {
    throw new Error(`feathers-reactive: setting options.idField is mandatory`);
  }

  options = Object.assign({
    dataField: 'data',
    sorter: makeSorter,
    matcher: siftMatcher,
    // Whether to requery service when a change is detected
    listStrategy: 'smart',
    listStrategies
  }, options);

  const mixin = function (service) {
    const app = this;

    const events = {
      created: fromEvent(service, 'created'),
      updated: fromEvent(service, 'updated'),
      patched: fromEvent(service, 'patched'),
      removed: fromEvent(service, 'removed')
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

    // workaround for Firefox
    // FF defines Object.prototype.watch(), so uberproto doesn't recognize the mixin's .watch()
    // see https://github.com/feathersjs-ecosystem/feathers-reactive/issues/67
    if (Object.prototype.watch && Object.prototype.watch === newService.watch) {
      newService.watch = mixin.watch;
    }

    // bind the new service to all reactive methods
    for (let method in reactiveMethods) {
      reactiveMethods[method] = reactiveMethods[method].bind(newService);
    }
  };

  return function (app) {
    debug('Initializing feathers-reactive plugin');

    app.mixins.push(mixin);
  };
}

FeathersRx.strategy = strategies;

module.exports = FeathersRx;
