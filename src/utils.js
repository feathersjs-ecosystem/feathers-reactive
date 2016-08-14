const promiseMethods = ['then', 'catch'];
import { sorter as createSorter } from 'feathers-commons/lib/utils';

export function promisify(obj, promise) {
  promiseMethods.forEach(method => {
    Object.defineProperty(obj, method, {
      enumerable: false,
      value: function(... args) {
        return promise.then(... args);
      }
    });
  });

  return obj;
}

export function makeSorter(query, options) {
  // The sort function (if $sort is set)
  const sorter = query.$sort ? createSorter(query.$sort) : createSorter({
    [options.idField]: 1
  });

  return function(result) {
    const isPaginated = !!result[options.dataField];
    let data = isPaginated ? result[options.dataField] : result;

    if(sorter) {
      data = data.sort(sorter);
    }

    const limit = typeof result.limit === 'number' ?
      result.limit : parseInt(query.$limit, 10);

    if(limit && !isNaN(limit)) {
      data = data.slice(0, limit);
    }

    if(isPaginated) {
      result[options.dataField] = data;
    } else {
      result = data;
    }

    return result;
  };
}

export function getOptions(base, ...others) {
  const options = Object.assign({}, base, ... others);

  if(typeof options.listStrategy === 'string') {
    options.listStrategy = options.listStrategies[options.listStrategy];
  }

  return options;
}
