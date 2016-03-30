const Rx = require('rx');

export default function(events, options) {
  return function() {
    const result = this._super.apply(this, arguments);

    if(typeof result.then !== 'function') {
      return result;
    }
    const source = Rx.Observable.fromPromise(result);
    return source.concat(source.flatMapFirst(data =>
      Rx.Observable.merge(
        events.created.map(eventData =>
          items => items.concat(eventData)
        ),
        events.removed.map(eventData =>
          items => items.filter(current => eventData[options.id] !== current[options.id])
        ),
        Rx.Observable.merge(events.updated, events.patched).map(eventData =>
          items => items.map(current =>
            eventData[options.id] === current[options.id] ?
              Object.assign({}, current, eventData) :
              current
          )
        )
      ).scan((current, callback) => callback(current), data)
    ));
  };
}
