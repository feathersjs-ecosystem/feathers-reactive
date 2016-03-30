import assert from 'assert';
import feathers from 'feathers';
import memory from 'feathers-memory';

import rx from '../src';

describe('reactive resources', () => {
  let app, id, service;

  beforeEach(done => {
    app = feathers()
      .configure(rx({
        id: 'id'
      }))
      .use('/messages', memory());

    service = app.service('messages');

    service.create({
      text: 'A test message'
    }).first().toPromise().then(message => {
      id = message.id;
      done();
    });
  });

  it('.get as an observable', done => {
    service.get(id).first().subscribe(message => {
      assert.deepEqual(message, { id, text: 'A test message' });
      done();
    });
  });

  it('.update and .patch update existing stream', done => {
    let counter = 0;

    service.get(id).debounce(0).subscribe(message => {
      switch(++counter) {
        case 1:
          assert.deepEqual(message, { id, text: 'A test message' });
          service.update(id, { text: 'Updated', prop: true });
          break;
        case 2:
          assert.deepEqual(message, {
            id, text: 'Updated', prop: true
          });
          service.patch(id, { text: 'Updated again' });
          break;
        case 3:
          assert.deepEqual(message, {
            id, text: 'Updated again', prop: true
          });
          done();
      }
    });
  });

  it('.remove emits null', done => {
    service.get(id).subscribe(message => {
      if(message === null) {
        done();
      } else {
        assert.deepEqual(message, { id, text: 'A test message' });
      }
    });

    // TODO investigate why setTimeout is necessary
    setTimeout(() => service.remove(id), 20);
  });
});
