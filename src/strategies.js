import { merge, of } from 'rxjs';
import {
  concat,
  switchMap,
  concatMapTo,
  filter,
  map,
  scan,
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
          const process = data => data.concat(eventData);

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
      const reset$ = this.reset$;
      return merge(source$, reset$.pipe(concatMapTo(source$))).pipe(
        switchMap((data) =>
          of(data).pipe(
            concat(
              events$.pipe(
                scan(
                  (current, callback) => sortAndTrim(callback(current)),
                  data
                )
              )
            )
          )
        )
      );
    }
  };
};
