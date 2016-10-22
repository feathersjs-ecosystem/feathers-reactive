export default function (Rx) {
  return {
    never (source) {
      return source;
    },

    always (source, events, options, args) {
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
          const source = Rx.Observable.fromPromise(_super(...args));

          return source.map(sortAndTrim);
        })
      ));
    },

    smart (source, events, options, args) {
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
            data.filter(current =>
              eventData[options.idField] !== current[options.idField]
            ).concat(eventData).filter(matches);

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

      return source.concat(source.exhaustMap(data =>
        Rx.Observable.merge(
          events.created.filter(matches).map(onCreated),
          events.removed.map(onRemoved),
          Rx.Observable.merge(events.updated, events.patched).map(onUpdated)
        ).scan((current, callback) => sortAndTrim(callback(current)), data)
      ));
    }
  };
}
