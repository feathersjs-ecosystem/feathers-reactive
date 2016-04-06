import Rx from 'rx';
import reactiveResource from './resource';
import reactiveList from './list';

const debug = require('debug')('feathers-rx');

export default function(options) {
  options = Object.assign({
    id: 'id',
    // The merging strategy
    merge(current, eventData) {
      return Object.assign({}, current, eventData);
    }
  }, options);

  const mixin = function(service) {
    const app = this;
    const mixin = {};
    const events = {
      created: Rx.Observable.fromEvent(service, 'created'),
      updated: Rx.Observable.fromEvent(service, 'updated'),
      patched: Rx.Observable.fromEvent(service, 'patched'),
      removed: Rx.Observable.fromEvent(service, 'removed')
    };
    const resourceMethod = reactiveResource(events, options);

    app.methods.forEach(method => {
      if(method !== 'find' && typeof service[method] === 'function') {
        mixin[method] = resourceMethod;
      }
    });

    if(typeof service.find === 'function') {
      mixin.find = reactiveList(events, options);
    }

    service.mixin(mixin);
  };

  return function() {
    debug('Initializing feathers-rx plugin');

    const app = this;

    app.mixins.push(mixin);
  };
}
