import { matcher } from 'feathers-commons/lib/utils';
import reactiveResource from './resource';
import reactiveList from './list';
import strategies from './strategies';
import { makeSorter } from './utils';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/mapTo';
import 'rxjs/add/operator/exhaustMap';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/mergeMap';

const debug = require('debug')('feathers-reactive');

function FeathersRx (options = {}) {
  const listStrategies = strategies();

  if (!options.idField) {
    throw `feathers-reactive: setting options.idField is mandatory`
  }

  options = Object.assign({
    idField: 'id',
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

    app.methods.forEach(method => {
      if (typeof service[method] === 'function') {
        reactiveMethods[method] = method === 'find'
          ? reactiveList(events, options)
          : reactiveResource(events, options, method);
      }
    });

    const mixin = {
      rx (options = {}) {
        this._rx = options;
        return this;
      },
      watch () {
        return reactiveMethods;
      }
    };

    // get the new service object
    const newService = service.mixin(mixin);

    // bind the new service to all reactive methods
    for (let m in reactiveMethods) {
      reactiveMethods[m] = reactiveMethods[m].bind(newService);
    }
  };

  return function () {
    debug('Initializing feathers-reactive plugin');

    this.mixins.push(mixin);
  };
}

FeathersRx.strategy = strategies;

export default FeathersRx;
