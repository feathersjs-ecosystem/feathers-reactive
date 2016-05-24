# feathers-reactive

[![Build Status](https://travis-ci.org/feathersjs/feathers-reactive.png?branch=master)](https://travis-ci.org/feathersjs/feathers-reactive)

> Reactive API extensions for Feathers

## About

`feathers-reactive` turns a [Feathers service](http://docs.feathersjs.com/services/readme.html) call into an [RxJS](https://github.com/Reactive-Extensions/RxJS) observables that automatically updates on [real-time events](http://docs.feathersjs.com/real-time/events.html).

## Simple example

```js
const feathers = require('feathers');
const memory = require('feathers-memory');
const rx = require('feathers-reactive');
const RxJS = require('rxjs');

const app = feathers()
  .configure(rx(RxJS))
  .use('/messages', memory());

const messages = app.service('messages');

messages.create({
  text: 'A test message'
}).then(() => {
  // Get a specific message with id 0. Emit the message data once it resolves
  // and every time it changes e.g. through an updated or patched event
  messages.get(0).subscribe(message => console.log('My message', message));

  // Find all messages and emit a new list every time anything changes
  messages.find().subscribe(messages => console.log('Message list', messages));

  setTimeout(() => {
    messages.create({ text: 'Another message' }).then(() =>
      setTimeout(() => messages.patch(0, { text: 'Updated message' }), 1000)
    );
  }, 1000);
});
```

Will output:

```
My message { text: 'A test message', id: 0 }
Message list [ { text: 'A test message', id: 0 } ]
Message list [ { text: 'A test message', id: 0 },
  { text: 'Another message', id: 1 } ]
My message { text: 'Updated message', id: 0 }
Message list [ { text: 'Updated message', id: 0 },
  { text: 'Another message', id: 1 } ]
```

## Changelog

__0.1.0__

- Initial release

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
