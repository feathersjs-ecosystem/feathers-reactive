import {matcher} from 'feathers-commons/lib/utils';
import reactiveResource from './resource';
import reactiveList from './list';
import strategies from './strategies';
import {makeSorter} from './utils';

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

function FeathersRx (RxOrOptions, options = {}) {
  if(RxOrOptions.Observable){
    console.warn('feathers-reactive: RxJS is a hard dependency now and should no longer be passed to feathers-reactive as an argument.')
  } else {
    options = RxOrOptions || {};
  }

  const listStrategies = strategies();

  if (!options.idField) {
    console.warn('feathers-reactive: options.idField is not configured and will be set to \'id\' by default. If your db uses a different field like \'_id\', make sure to set idField properly.');
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

    // object to hold our reactive methods
    const reactiveMethods = {};

    app.methods.forEach(method => {
      if (typeof service[method] === 'function') {
        reactiveMethods[method] = method === 'find'
          ? reactiveList(events, options)
          : reactiveResource(events, options, method);
      }
    });

    mixin.watch = () => reactiveMethods;

    // get the new service object
    const newThis = service.mixin(mixin);

    // bind the new service to all reactive methods
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
