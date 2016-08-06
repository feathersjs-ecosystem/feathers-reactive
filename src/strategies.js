export default function(Rx) {
  return {
    never(source) {
      return source;
    },

    always(source, events, options, args) {
      const params = args[0] || {};
      const query = Object.assign({}, params.query);
      const _super = this._super.bind(this);

      // A function that returns if an item matches the query
      const matches = options.matcher(query);
      // A function that sorts a limits a result (paginated or not)
      const sortAndTrim = options.sorter(query, options);

      return source.concat(source.exhaustMap(() =>
        Rx.Observable.merge(
          events.created.filter(matches),
          events.removed,
          events.updated,
          events.patched
        ).flatMap(() => {
          const result = _super(...args);
          const source = Rx.Observable.fromPromise(result);

          return source.map(sortAndTrim);
        })
      ));
    },

    smart(source, events, options, args) {
      const params = args[0] || {};
      const query = Object.assign({}, params.query);
      // A function that returns if an item matches the query
      const matches = options.matcher(query);
      // A function that sorts a limits a result (paginated or not)
      const sortAndTrim = options.sorter(query, options);
      const onCreated = eventData => {
        return items => {
          const result = items.concat(eventData);
          // result.total = 1;
          return result;
        };
      };
      const onRemoved = eventData => {
        return items => items.filter(current =>
          eventData[options.idField] !== current[options.idField]
        );
      };
      const onUpdated = eventData => {
        return items => items.filter(current =>
          eventData[options.idField] !== current[options.idField]
        ).concat(eventData).filter(matches);
      };

      return source.concat(source.exhaustMap(data =>
        Rx.Observable.merge(
          events.created.filter(matches).map(onCreated),
          events.removed.map(onRemoved),
          Rx.Observable.merge(events.updated, events.patched).map(onUpdated)
        ).scan((current, callback) => {
          const isPaginated = !!current[options.dataField];
          if (isPaginated) {
            current[options.dataField] = callback(current[options.dataField]);
          } else {
            current = callback(current);
          }
          return sortAndTrim(current);
        }, data)
      ));
    }
  };
}
