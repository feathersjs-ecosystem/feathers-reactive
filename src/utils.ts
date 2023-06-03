import { _ } from '@feathersjs/commons';
import { sorter as createSorter } from '@feathersjs/adapter-commons';
import { defer } from 'rxjs';
import sift from 'sift';

export function getSource(originalMethod, args) {
  return defer(() => originalMethod(...args));
}

export function makeSorter(query, options) {
  // The sort function (if $sort is set)
  const sorter = query.$sort
    ? createSorter(query.$sort)
    : createSorter({
        [options.idField]: 1
      });

  return function (result) {
    const isPaginated = !!result[options.dataField];
    let data = isPaginated ? result[options.dataField] : result;

    if (sorter) {
      data = data.sort(sorter);
    }

    const limit =
      typeof result.limit === 'number'
        ? result.limit
        : parseInt(query.$limit, 10);

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

export function getOptions(base, ...others) {
  const options = Object.assign({}, base, ...others);

  if (typeof options.listStrategy === 'string') {
    options.listStrategy = options.listStrategies[options.listStrategy];
  }

  return options;
}

export function getPipeStream(stream, options) {
  if (!options.pipe) {
    return stream;
  } else if (Array.isArray(options.pipe)) {
    return stream.pipe(...options.pipe);
  } else {
    return stream.pipe(options.pipe);
  }
}

export function getParamsPosition(method) {
  // The position of the params parameters for a service method so that we can extend them
  // default is 1

  const paramsPositions = {
    find: 0,
    update: 2,
    patch: 2
  };

  return method in paramsPositions ? paramsPositions[method] : 1;
}

export function siftMatcher(originalQuery) {
  const keysToOmit = Object.keys(originalQuery).filter(
    (key) => key.charCodeAt(0) === 36
  );
  const query = _.omit(originalQuery, ...keysToOmit);

  return sift(query);
}
