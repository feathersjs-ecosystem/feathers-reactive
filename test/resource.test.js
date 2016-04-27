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
        .configure(rx())
        .use('/messages', memory());

      service = app.service('messages').rx({id: 'customId'});

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
        .configure(rx())
        .use('/messages', memory({ idField: 'customId' }));

      service = app.service('messages').rx({id: 'customId'});

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
        .configure(rx())
        .configure(hooks())
        .use('/messages', memory({ idField: 'customId' }));

      service = app.service('messages').rx().before({
        all: [function (hook) { hook.params.rx = { id: 'customID' }; }]
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
      });
    });

    it('.get as an observable', done => {
      service.get(id).first().subscribe(message => {
        assert.deepEqual(message, { [customId]: id, text: 'A test message' });
        done();
      });
    });

    it('.update and .patch update existing stream', done => {
      const result = service.get(id);

      result.first().subscribe(message => {
        assert.deepEqual(message, { [customId]: id, text: 'A test message' });
        service.update(id, { text: 'Updated', prop: true });
      });

      result.skip(1).first().subscribe(message => {
        assert.deepEqual(message, {
          [customId]: id, text: 'Updated', prop: true
        });
        service.patch(id, { text: 'Updated again' });
      });

      result.skip(2).first().subscribe(message => {
        assert.deepEqual(message, {
          [customId]: id, text: 'Updated again', prop: true
        });
        done();
      });
    });

    it('.remove emits null', done => {
      service.get(id).subscribe(message => {
        if(message === null) {
          done();
        } else {
          assert.deepEqual(message, { [customId]: id, text: 'A test message' });
        }
      });

      // TODO investigate why setTimeout is necessary
      setTimeout(() => service.remove(id), 20);
    });
  }

});
