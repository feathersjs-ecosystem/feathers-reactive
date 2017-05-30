import assert from 'assert';
import feathers from 'feathers';
import memory from 'feathers-memory';
import hooks from 'feathers-hooks';

import rx from '../src';

describe('reactive resources', () => {
  let app, id, service;

  describe('standard id', function () {
    beforeEach(done => {
      app = feathers()
        .configure(rx({idField: 'id'}))
        .use('/messages', memory());

      service = app.service('messages');
      service.create({
        text: 'A test message'
      }).then(message => {
        id = message.id;
        done();
      });
    });
    baseTests('id');
  });

  describe('custom id on service', function () {
    beforeEach(done => {
      app = feathers()
        .configure(rx({idField: 'id'}))
        .use('/messages', memory({ idField: 'customId' }));

      service = app.service('messages').rx({ idField: 'customId' });

      service.create({
        text: 'A test message'
      }).then(message => {
        id = message.customId;
        done();
      });
    });
    baseTests('customId');
  });

  describe('custom id on params', function () {
    beforeEach(done => {
      app = feathers()
        .configure(rx({idField: 'id'}))
        .configure(hooks())
        .use('/messages', memory({ idField: 'customId' }));

      service = app.service('messages').before({
        all: [function (hook) { hook.params.rx = { idField: 'customId' }; }]
      });

      service.create({
        text: 'A test message'
      }).then(message => {
        id = message.customId;
        done();
      });
    });
    baseTests('customId');
  });

  function baseTests (customId) {
    it('methods are still Promise compatible', done => {
      service.get(id).then(message => {
        assert.deepEqual(message, { [customId]: id, text: 'A test message' });
        done();
      }, done);
    });

    it('.get as an observable', done => {
      service.watch().get(id).first().subscribe(message => {
        assert.deepEqual(message, { [customId]: id, text: 'A test message' });
        done();
      }, done);
    });

    it('lazy execution on subscription', done => {
      let ran = false;

      app.use('/dummy', {
        get (id) {
          ran = true;

          return Promise.resolve({
            id, description: `Do ${id}!`
          });
        }
      });

      const source = app.service('dummy').watch().get('dishes', {
        rx: { lazy: true }
      });

      assert.ok(!ran);

      source.subscribe(data => {
        assert.deepEqual(data, {
          id: 'dishes',
          description: 'Do dishes!'
        });
        assert.ok(ran);
        done();
      }, done);
    });

    it('.update and .patch update existing stream', done => {
      const result = service.watch().get(id);

      result.first().subscribe(message => {
        assert.deepEqual(message, { [customId]: id, text: 'A test message' });
        service.update(id, { text: 'Updated', prop: true });
      }, done);

      result.skip(1).first().subscribe(message => {
        assert.deepEqual(message, {
          [customId]: id, text: 'Updated', prop: true
        });
        service.patch(id, { text: 'Updated again' });
      }, done);

      result.skip(2).first().subscribe(message => {
        assert.deepEqual(message, {
          [customId]: id, text: 'Updated again', prop: true
        });
        done();
      }, done);
    });

    it('.remove emits null', done => {
      service.watch().get(id).subscribe(message => {
        if (message === null) {
          done();
        } else {
          assert.deepEqual(message, { [customId]: id, text: 'A test message' });
        }
      }, done);

      setTimeout(() => service.remove(id), 20);
    });
  }
});
