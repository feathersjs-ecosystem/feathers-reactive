import { Observable } from 'rxjs';
import { merge, of } from 'rxjs';
import {
  concat,
  switchMap,
  concatMapTo,
  filter,
  map,
  scan
} from 'rxjs/operators';

import type { ReactiveServiceMixin } from './interfaces';
import { Paginated } from '@feathersjs/feathers';

export function strategies<T>() {
  return {
    // created$: new Observable<T>(),
    // updated$: new Observable<T>(),
    // patched$: new Observable<T>(),
    // removed$: new Observable<T>(),
    // reset$: new Observable<void>(),

    never(source$: Observable<T>) {
      return source$;
    },

    always(source$: Observable<T>, options, args) {
      const params = args[0] || {};
      const query = Object.assign({}, params.query);

      // A function that returns if an item matches the query
      const matches = options.matcher(query);

      const events$ = merge(
        this.created$.pipe(filter(matches)),
        this.removed$,
        this.updated$,
        this.patched$
      );

      return source$.pipe(concat(events$.pipe(concatMapTo(source$))));
    },

    smart(source$: Observable<T>, options, args) {
      const params = args[0] || {};
      const query = Object.assign({}, params.query);
      // A function that returns if an item matches the query
      const matches = options.matcher(query);
      // A function that sorts a limits a result (paginated or not)
      const sortAndTrim = options.sorter(query, options);

      const onCreated = (eventData: any) => {
        return (page: Paginated<T> | T[]) => {
          const isPaginated = !!(page as any)[options.dataField];
          const process = (data: T[]) => {
            // We should not add object twice
            const exists = data.find(
              (current) =>
                eventData[options.idField] === (current as any)[options.idField]
            );
            return exists ? data : data.concat(eventData);
          };

          if (isPaginated) {
            return Object.assign({}, page, {
              total: (page as Paginated<T>).total + 1,
              [options.dataField]: process((page as any)[options.dataField])
            });
          }

          return process(page as T[]);
        };
      };
      const onRemoved = (eventData: any) => {
        return (page: Paginated<T> | T[]) => {
          const isPaginated = !!(page as any)[options.dataField];
          const process = (data: T[]) =>
            data.filter(
              (current) =>
                eventData[options.idField] !== (current as any)[options.idField]
            );

          if (isPaginated) {
            return Object.assign({}, page, {
              total: matches(eventData)
                ? (page as Paginated<T>).total - 1
                : (page as Paginated<T>).total,
              [options.dataField]: process((page as any)[options.dataField])
            });
          }

          return process(page as T[]);
        };
      };
      const onUpdated = (eventData: any) => {
        return (page: Paginated<T> | T[]) => {
          const isPaginated = !!(page as any)[options.dataField];
          const length = isPaginated
            ? (page as any)[options.dataField].length
            : (page as T[]).length;
          const process = (data: T[]) => {
            // Remove previous matching object if any
            let newData = data.filter(
              (current) =>
                eventData[options.idField] !== (current as any)[options.idField]
            );
            // We should not add object we are not already aware of
            // except if update has changed it from an unmatched to a matched object
            if (newData.length < data.length || matches([eventData])) {
              newData = newData.concat(eventData);
            }
            return newData.filter(matches);
          };

          if (isPaginated) {
            const processed = process((page as any)[options.dataField]);
            return Object.assign({}, page, {
              // Total can be either decreased or increased based
              // on if the update removed or added the item to the list
              total: (page as Paginated<T>).total - (length - processed.length),
              [options.dataField]: processed
            });
          }

          return process(page as T[]);
        };
      };

      const events$ = merge(
        this.created$.pipe(filter(matches), map(onCreated)),
        this.removed$.pipe(map(onRemoved)),
        merge(this.updated$, this.patched$).pipe(map(onUpdated))
      );
      const reset$ = this.reset$;
      return merge(source$, reset$.pipe(concatMapTo(source$))).pipe(
        switchMap((data) =>
          of(data).pipe(
            concat(
              events$.pipe(
                scan(
                  (current, callback) =>
                    sortAndTrim((callback as any)(current)), // TODO: Hacky type cast to make typescript happy
                  data
                )
              )
            )
          )
        )
      );
    }
  } as ReactiveServiceMixin<T>;
}
