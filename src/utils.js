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
  const sorter = query.$sort ? createSorter(query.$sort) : null;

  return function(result) {
    const isPaginated = !!result[options.dataField];
    let data = isPaginated ? result[options.dataField] : result;

    if(sorter) {
      data = data.sort(sorter);
    }

    if(typeof result.limit !== 'undefined') {
      data = data.slice(0, result.limit);
    }

    if(isPaginated) {
      result[options.dataField] = data;
    } else {
      result = data;
    }

    return result;
  };
}
