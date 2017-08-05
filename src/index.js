const { matcher } = require('feathers-commons/lib/utils');
const reactiveResource = require('./resource');
const reactiveList = require('./list');
const strategies = require('./strategies');
const {
  makeSorter,
  getParamsPosition
} = require('./utils');

const { Observable } = require('rxjs/Observable');
require('rxjs/add/observable/fromEvent');
require('rxjs/add/observable/fromPromise');
require('rxjs/add/observable/merge');
require('rxjs/add/operator/concat');
require('rxjs/add/operator/exhaustMap');
require('rxjs/add/operator/filter');
require('rxjs/add/operator/let');
require('rxjs/add/operator/map');
require('rxjs/add/operator/mapTo');
require('rxjs/add/operator/mergeMap');
require('rxjs/add/operator/scan');

const debug = require('debug')('feathers-reactive');

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
