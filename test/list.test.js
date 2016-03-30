import assert from 'assert';
import feathers from 'feathers';
import memory from 'feathers-memory';

import rx from '../src';

describe('reactive lists', () => {
  let app, service;

  beforeEach(done => {
    app = feathers()
      .configure(rx({
        id: 'id'
      }))
      .use('/messages', memory());

    service = app.service('messages');

    service.create({
      text: 'A test message'
    }).first().toPromise().then(() => done());
  });

  it('.find as an observable', done => {
    service.find().first().subscribe(messages => {
      assert.deepEqual(messages, [ { text: 'A test message', id: 0 } ]);
      done();
    });
  });

  it('.create and .find', done => {
    service.find().subscribe(messages => {
      // assert.deepEqual(messages, [ { text: 'A test message', id: 0 } ]);
      if(messages.length === 2) {
        done();
      }
    });

    setTimeout(() => service.create({ text: 'Another message' }), 20);
  });
});
