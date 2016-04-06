import assert from 'assert';
import feathers from 'feathers';
import memory from 'feathers-memory';

import rx from '../src';

describe('reactive resources', () => {
  let app, id, service;

  beforeEach(done => {
    app = feathers()
      .configure(rx())
      .use('/messages', memory());

    service = app.service('messages');

    service.create({
      text: 'A test message'
    }).then(message => {
      id = message.id;
      done();
    });
  });

  it('methods are still Promise compatible', done => {
    service.get(id).then(message => {
      assert.deepEqual(message, { id, text: 'A test message' });
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
    // TODO investigate why `debounce` is necessary
    const result = service.get(id).debounce(0);

    result.first().subscribe(message => {
      assert.deepEqual(message, { id, text: 'A test message' });
      service.update(id, { text: 'Updated', prop: true });
    });

    result.skip(1).first().subscribe(message => {
      assert.deepEqual(message, {
        id, text: 'Updated', prop: true
      });
      service.patch(id, { text: 'Updated again' });
    });

    result.skip(2).first().subscribe(message => {
      assert.deepEqual(message, {
        id, text: 'Updated again', prop: true
      });
      done();
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
