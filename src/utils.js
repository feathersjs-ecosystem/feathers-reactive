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

    let limit = null;

    if(typeof result.limit === 'number') {
      limit = result.limit;
    } else if(query.$limit) {
      limit = parseInt(query.$limit, 10);
    }

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
