'use strict';

const _debug = require('debug');
const rxjs = require('rxjs');
const operators = require('rxjs/operators');
const sift = require('sift');
const stringify = require('json-stable-stringify');
const commons = require('@feathersjs/commons');
const adapterCommons = require('@feathersjs/adapter-commons');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const _debug__default = /*#__PURE__*/_interopDefaultCompat(_debug);
const sift__default = /*#__PURE__*/_interopDefaultCompat(sift);
const stringify__default = /*#__PURE__*/_interopDefaultCompat(stringify);

const debug$1 = _debug__default("feathers-reactive");
function cacheObservable(cache = {}, method, key, observable) {
  const hash = _hash(key);
  const cachedObservable = observable.pipe(
    operators.finalize(() => {
      debug$1("removing cache item: ", hash);
      delete cache[method][hash];
    }),
    _oldStyleShareReplay(1)
  );
  cache[method][hash] = cachedObservable;
  return cache[method][hash];
}
function getCachedObservable(cache = {}, method, key) {
  const hash = _hash(key);
  return cache[method][hash];
}
function _hash(key) {
  return stringify__default(key);
}
function _oldStyleShareReplay(bufferSize, windowTime, scheduler) {
  let subject;
  const connectable = operators.multicast(function shareReplaySubjectFactory() {
    if (this._isComplete) {
      return subject;
    } else {
      return subject = new rxjs.ReplaySubject(bufferSize, windowTime, scheduler);
    }
  });
  return (source) => operators.refCount()(connectable(source));
}

function getSource(originalMethod, args) {
  return rxjs.defer(() => originalMethod(...args));
}
function makeSorter(query, options) {
  const sorter = query.$sort ? adapterCommons.sorter(query.$sort) : adapterCommons.sorter({
    [options.idField]: 1
  });
  return function(result) {
    const isPaginated = !!result[options.dataField];
    let data = isPaginated ? result[options.dataField] : result;
    if (sorter) {
      data = data.sort(sorter);
    }
    const limit = typeof result.limit === "number" ? result.limit : parseInt(query.$limit, 10);
    if (limit && !isNaN(limit) && limit !== -1) {
      data = data.slice(0, limit);
    }
    if (isPaginated) {
      result[options.dataField] = data;
    } else {
      result = data;
    }
    return result;
  };
}
function getOptions(base, ...others) {
  const options = Object.assign({}, base, ...others);
  if (typeof options.listStrategy === "string") {
    options.listStrategy = options.listStrategies[options.listStrategy];
  }
  return options;
}
function getPipeStream(stream, options) {
  if (!options.pipe) {
    return stream;
  } else if (Array.isArray(options.pipe)) {
    return stream.pipe(...options.pipe);
  } else {
    return stream.pipe(options.pipe);
  }
}
function getParamsPosition(method) {
  const paramsPositions = {
    find: 0,
    update: 2,
    patch: 2
  };
  return method in paramsPositions ? paramsPositions[method] : 1;
}
function siftMatcher(originalQuery) {
  const keysToOmit = Object.keys(originalQuery).filter(
    (key) => key.charCodeAt(0) === 36
  );
  const query = commons._.omit(originalQuery, ...keysToOmit);
  return sift__default(query);
}

function reactiveList(settings) {
  return function(params) {
    const cachedObservable = getCachedObservable(this._cache, "find", params);
    if (cachedObservable) {
      return cachedObservable;
    }
    const options = getOptions(settings, this._rx, params.rx);
    const source = getSource(this.find.bind(this), arguments);
    const stream = options.listStrategy.call(this, source, options, arguments);
    const pipeStream = getPipeStream(stream, options);
    return cacheObservable(this._cache, "find", params, pipeStream);
  };
}

function reactiveResource(settings, method) {
  return function() {
    const position = getParamsPosition(method);
    const params = arguments[position] || {};
    const cachedObservable = method === "get" ? getCachedObservable(
      this._cache,
      "get",
      /* id */
      arguments[0]
    ) : void 0;
    if (cachedObservable) {
      return cachedObservable;
    }
    const options = getOptions(settings, this._rx, params.rx);
    const source = getSource(this[method].bind(this), arguments);
    const stream = source.pipe(
      operators.concatMap((data) => {
        const filterFn = (current) => current[options.idField] === data[options.idField];
        const filteredRemoves = this.removed$.pipe(operators.filter(filterFn));
        const filteredEvents = rxjs.merge(
          this.created$,
          this.updated$,
          this.patched$
        ).pipe(operators.filter(filterFn));
        const combinedEvents = rxjs.merge(
          // Map to a callback that merges old and new data
          filteredEvents,
          // filtered `removed` events always mapped to `null`
          filteredRemoves.pipe(operators.mapTo(null))
        );
        return rxjs.of(data).pipe(operators.concat(combinedEvents));
      })
    );
    const pipeStream = getPipeStream(stream, options);
    return method === "get" ? cacheObservable(
      this._cache,
      "get",
      /* id */
      arguments[0],
      pipeStream
    ) : pipeStream;
  };
}

function strategies() {
  return {
    // created$: new Observable<T>(),
    // updated$: new Observable<T>(),
    // patched$: new Observable<T>(),
    // removed$: new Observable<T>(),
    // reset$: new Observable<void>(),
    never(source$) {
      return source$;
    },
    always(source$, options, args) {
      const params = args[0] || {};
      const query = Object.assign({}, params.query);
      const matches = options.matcher(query);
      const events$ = rxjs.merge(
        this.created$.pipe(operators.filter(matches)),
        this.removed$,
        this.updated$,
        this.patched$
      );
      return source$.pipe(operators.concat(events$.pipe(operators.concatMapTo(source$))));
    },
    smart(source$, options, args) {
      const params = args[0] || {};
      const query = Object.assign({}, params.query);
      const matches = options.matcher(query);
      const sortAndTrim = options.sorter(query, options);
      const onCreated = (eventData) => {
        return (page) => {
          const isPaginated = !!page[options.dataField];
          const process = (data) => {
            const exists = data.find(
              (current) => eventData[options.idField] === current[options.idField]
            );
            return exists ? data : data.concat(eventData);
          };
          if (isPaginated) {
            return Object.assign({}, page, {
              total: page.total + 1,
              [options.dataField]: process(page[options.dataField])
            });
          }
          return process(page);
        };
      };
      const onRemoved = (eventData) => {
        return (page) => {
          const isPaginated = !!page[options.dataField];
          const process = (data) => data.filter(
            (current) => eventData[options.idField] !== current[options.idField]
          );
          if (isPaginated) {
            return Object.assign({}, page, {
              total: matches(eventData) ? page.total - 1 : page.total,
              [options.dataField]: process(page[options.dataField])
            });
          }
          return process(page);
        };
      };
      const onUpdated = (eventData) => {
        return (page) => {
          const isPaginated = !!page[options.dataField];
          const length = isPaginated ? page[options.dataField].length : page.length;
          const process = (data) => {
            let newData = data.filter(
              (current) => eventData[options.idField] !== current[options.idField]
            );
            if (newData.length < data.length || matches([eventData])) {
              newData = newData.concat(eventData);
            }
            return newData.filter(matches);
          };
          if (isPaginated) {
            const processed = process(page[options.dataField]);
            return Object.assign({}, page, {
              // Total can be either decreased or increased based
              // on if the update removed or added the item to the list
              total: page.total - (length - processed.length),
              [options.dataField]: processed
            });
          }
          return process(page);
        };
      };
      const events$ = rxjs.merge(
        this.created$.pipe(operators.filter(matches), operators.map(onCreated)),
        this.removed$.pipe(operators.map(onRemoved)),
        rxjs.merge(this.updated$, this.patched$).pipe(operators.map(onUpdated))
      );
      const reset$ = this.reset$;
      return rxjs.merge(source$, reset$.pipe(operators.concatMapTo(source$))).pipe(
        operators.switchMap(
          (data) => rxjs.of(data).pipe(
            operators.concat(
              events$.pipe(
                operators.scan(
                  (current, callback) => sortAndTrim(callback(current)),
                  // TODO: Hacky type cast to make typescript happy
                  data
                )
              )
            )
          )
        )
      );
    }
  };
}

const debug = _debug__default("feathers-reactive");
function rx(options = {
  idField: "_id"
}) {
  const listStrategies = strategies();
  const resetSubject = new rxjs.Subject();
  if (!options.idField) {
    throw new Error("feathers-reactive: setting options.idField is mandatory");
  }
  options = Object.assign(
    {
      dataField: "data",
      sorter: makeSorter,
      matcher: siftMatcher,
      // Whether to requery service when a change is detected
      listStrategy: "smart",
      listStrategies
    },
    options
  );
  const mixin = function(service) {
    const events = {
      // fromEvent's result selector (3rd arg) is deprecated
      // we need it here because service events have an inconsistent number of arguments (i.e. sometimes 1, sometimes >1)
      // related: https://github.com/ReactiveX/rxjs/issues/3751
      created: rxjs.fromEvent(service, "created", (...args) => args[0]).pipe(
        operators.share()
      ),
      updated: rxjs.fromEvent(service, "updated", (...args) => args[0]).pipe(
        operators.share()
      ),
      patched: rxjs.fromEvent(service, "patched", (...args) => args[0]).pipe(
        operators.share()
      ),
      removed: rxjs.fromEvent(service, "removed", (...args) => args[0]).pipe(
        operators.share()
      ),
      reset: resetSubject.asObservable()
    };
    const reactiveMethods = {};
    const cache = {
      find: {},
      get: {}
    };
    const methods = ["find", "get", "create", "update", "patch", "remove"];
    methods.forEach((method) => {
      if (typeof service[method] === "function") {
        reactiveMethods[method] = method === "find" ? reactiveList(options) : reactiveResource(options, method);
      }
    });
    const mixin2 = {
      _cache: cache,
      created$: events.created,
      updated$: events.updated,
      patched$: events.patched,
      removed$: events.removed,
      reset$: events.reset,
      _rx: {},
      // TODO: Added during typescript migration. Is this needed?
      rx(options2 = {}) {
        this._rx = options2;
        return this;
      },
      reset() {
        resetSubject.next();
      },
      watch(options2 = {}) {
        const boundMethods = {};
        Object.keys(reactiveMethods).forEach((method) => {
          const position = getParamsPosition(method);
          boundMethods[method] = (...args) => {
            args[position] = Object.assign(args[position] || {}, {
              rx: options2
            });
            return reactiveMethods[method](...args);
          };
        });
        return boundMethods;
      }
    };
    const newService = Object.assign(service, mixin2);
    if (Object.prototype.watch && Object.prototype.watch === newService.watch) {
      newService.watch = mixin2.watch;
    }
    for (const method in reactiveMethods) {
      reactiveMethods[method] = reactiveMethods[method].bind(newService);
    }
  };
  return function(app) {
    debug("Initializing feathers-reactive plugin");
    app.mixins.push(mixin);
    if (app.io && typeof app.io.addEventListener === "function") {
      app.io.addListener = app.io.addEventListener;
    }
  };
}
rx.strategy = strategies;
rx.sift = sift__default;

exports.rx = rx;
