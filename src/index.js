import Debug from 'debug';

import { fromEvent, Subject } from 'rxjs';
import { share } from 'rxjs/operators';
import reactiveResource from './resource';
import reactiveList from './list';
import strategies from './strategies';
import { makeSorter, getParamsPosition, siftMatcher, sift } from './utils';

const debug = Debug('feathers-reactive');

function FeathersRx (options = {}) {
  const listStrategies = strategies();
  const resetSubject = new Subject();

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
      // fromEvent's result selector (3rd arg) is deprecated
      // we need it here because service events have an inconsistent number of arguments (i.e. sometimes 1, sometimes >1)
      // related: https://github.com/ReactiveX/rxjs/issues/3751
      created: fromEvent(service, 'created', (...args) => args[0]).pipe(share()),
      updated: fromEvent(service, 'updated', (...args) => args[0]).pipe(share()),
      patched: fromEvent(service, 'patched', (...args) => args[0]).pipe(share()),
      removed: fromEvent(service, 'removed', (...args) => args[0]).pipe(share()),
      reset: resetSubject.asObservable(),
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
      reset$: events.reset,
      rx (options = {}) {
        this._rx = options;
        return this;
      },
      reset(){
        resetSubject.next();
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
FeathersRx.sift = sift;

module.exports = FeathersRx;
