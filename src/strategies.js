import { merge, of } from 'rxjs';
import {
  concat,
  concatMap,
  concatMapTo,
  filter,
  map,
  scan
} from 'rxjs/operators';

module.exports = function () {
  return {
    never (source$) {
      return source$;
    },

    always (source$, options, args) {
      const params = args[0] || {};
      const query = Object.assign({}, params.query);

      // A function that returns if an item matches the query
      const matches = options.matcher(query);

      const events$ = merge(
        this.created$.pipe(
          filter(matches)
        ),
        this.removed$,
        this.updated$,
        this.patched$
      );

      return source$.pipe(
        concat(
          events$.pipe(
            concatMapTo(source$)
          )
        ));
    },

    smart (source$, options, args) {
      const params = args[0] || {};
      const query = Object.assign({}, params.query);
      // A function that returns if an item matches the query
      const matches = options.matcher(query);
      // A function that sorts a limits a result (paginated or not)
      const sortAndTrim = options.sorter(query, options);
      const onCreated = eventData => {
        return page => {
          const isPaginated = !!page[options.dataField];
          const process = data => {
            // We should not add object twice
            const exists = data.find(current =>
              eventData[options.idField] === current[options.idField]
            )
            return (exists ? data : data.concat(eventData));
          }

          if (isPaginated) {
            return Object.assign({}, page, {
              total: page.total + 1,
              [options.dataField]: process(page[options.dataField])
            });
          }

          return process(page);
        };
      };
      const onRemoved = eventData => {
        return page => {
          const isPaginated = !!page[options.dataField];
          const process = data => data.filter(current =>
            eventData[options.idField] !== current[options.idField]
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
      const onUpdated = eventData => {
        return page => {
          const isPaginated = !!page[options.dataField];
          const length = isPaginated ? page[options.dataField].length : page.length;
          const process = data =>
            data.filter(current => eventData[options.idField] !== current[options.idField])
              .concat(eventData)
              .filter(matches);
          /* Why this does not actually work ?
          const process = data => {
            // Remove previous matching object if any
            let newData = data.filter(current => eventData[options.idField] !== current[options.idField]);
            // We should not add object we are not already aware of however
            if (newData.length < data.length) {
              newData = newData.concat(eventData);
            }
            return newData.filter(matches);
          }*/

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

      const events$ = merge(
        this.created$.pipe(
          filter(matches),
          map(onCreated)
        ),
        this.removed$.pipe(
          map(onRemoved)
        ),
        merge(this.updated$, this.patched$).pipe(
          map(onUpdated)
        )
      );

      return source$.pipe(
        concatMap(data =>
          of(data).pipe(
            concat(
              events$.pipe(
                scan((current, callback) => sortAndTrim(callback(current)), data))
            )
          )
        ));
    }
  };
};
