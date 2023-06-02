import type { Application, ServiceAddons } from '@feathersjs/feathers';
import Debug from 'debug';
import { fromEvent, Subject } from 'rxjs';
import { share } from 'rxjs/operators';
import sift from 'sift';

import type { Options, ReactiveServiceMixin } from './interfaces';
import { reactiveList } from './list';
import { reactiveResource } from './resource';
import { strategies } from './strategies';
import { makeSorter, getParamsPosition, siftMatcher } from './utils';

const debug = Debug('feathers-reactive');

export function rx(
  options: Options = {
    idField: '_id'
  }
) {
  const listStrategies = strategies();
  const resetSubject = new Subject<void>();

  if (!options.idField) {
    throw new Error('feathers-reactive: setting options.idField is mandatory');
  }

  options = Object.assign(
    {
      dataField: 'data',
      sorter: makeSorter,
      matcher: siftMatcher,
      // Whether to requery service when a change is detected
      listStrategy: 'smart',
      listStrategies
    },
    options
  );

  const mixin = function (service: ServiceAddons) {
    const events = {
      // fromEvent's result selector (3rd arg) is deprecated
      // we need it here because service events have an inconsistent number of arguments (i.e. sometimes 1, sometimes >1)
      // related: https://github.com/ReactiveX/rxjs/issues/3751
      created: fromEvent(service, 'created', (...args) => args[0]).pipe(
        share()
      ),
      updated: fromEvent(service, 'updated', (...args) => args[0]).pipe(
        share()
      ),
      patched: fromEvent(service, 'patched', (...args) => args[0]).pipe(
        share()
      ),
      removed: fromEvent(service, 'removed', (...args) => args[0]).pipe(
        share()
      ),
      reset: resetSubject.asObservable()
    };

    // object to hold our reactive methods
    const reactiveMethods: any = {}; // TODO: Make real type

    const cache = {
      find: {},
      get: {}
    };

    const methods = ['find', 'get', 'create', 'update', 'patch', 'remove'];
    methods.forEach((method) => {
      // TODO: Added any during typescript migration.
      if (typeof (service as any)[method] === 'function') {
        reactiveMethods[method] =
          method === 'find'
            ? reactiveList(options)
            : reactiveResource(options, method);
      }
    });

    // TODO: ReactiveServiceMixin added during typescript migration. Is this correct?
    const mixin: ReactiveServiceMixin<any> & any = {
      _cache: cache,

      created$: events.created,
      updated$: events.updated,
      patched$: events.patched,
      removed$: events.removed,
      reset$: events.reset,
      _rx: {}, // TODO: Added during typescript migration. Is this needed?
      rx(options = {}) {
        this._rx = options;
        return this;
      },
      reset() {
        resetSubject.next();
      },
      watch(options = {}) {
        const boundMethods: any = {}; // TODO: Make real type

        Object.keys(reactiveMethods).forEach((method) => {
          const position = getParamsPosition(method);

          boundMethods[method] = (...args: any[]) => {
            // inject `options` into `params.rx`
            args[position] = Object.assign(args[position] || {}, {
              rx: options
            });
            return reactiveMethods[method](...args);
          };
        });

        return boundMethods;
      }
    };

    // get the extended service object
    const newService = Object.assign(service, mixin);

    // workaround for Firefox
    // FF defines Object.prototype.watch(), so uberproto doesn't recognize the mixin's .watch()
    // see https://github.com/feathersjs-ecosystem/feathers-reactive/issues/67
    // TODO: Added any during typescript migration.
    if (
      (Object.prototype as any).watch &&
      (Object.prototype as any).watch === newService.watch
    ) {
      newService.watch = mixin.watch;
    }

    // bind the new service to all reactive methods
    for (const method in reactiveMethods) {
      reactiveMethods[method] = reactiveMethods[method].bind(newService);
    }
  };

  return function (app: Application) {
    debug('Initializing feathers-reactive plugin');

    app.mixins.push(mixin);

    // TODO: Added any during typescript migration. What's the correct way of checking for socketio in v5?
    if (
      (app as any).io &&
      typeof (app as any).io.addEventListener === 'function'
    ) {
      (app as any).io.addListener = (app as any).io.addEventListener;
    }
  };
}

rx.strategy = strategies;
rx.sift = sift;

export { Options };
