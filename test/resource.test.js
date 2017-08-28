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

      const source = app.service('dummy').watch().get('dishes');

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

      setTimeout(() => service.remove(id));
    });

    it('injects options.let into observable chain', done => {
      const options = {
        let: obs => obs.do(() => done())
      };
      service.watch(options).get(0).subscribe();
    });

    it('.get uses caching', done => {
      let i = 0;

      const options = {
        let: obs => obs.do(() => i++)
      };

      service.watch(options).get(0).subscribe(() => {
        // expect i to have increased by 1
        assert.equal(i, 1);

        service.watch(options).get(0).subscribe(() => {
          // expect i to _not_ have increased further
          assert.equal(i, 1);

          done();
        });
      });
    });

    it('clears cache after unsubscription', done => {
      let i = 0;

      const options = {
        let: obs => obs.do(() => i++)
      };

      const sub1 = service.watch(options).get(0).subscribe();
      const sub2 = service.watch(options).get(0).subscribe();

      setTimeout(() => {
        sub1.unsubscribe();
        sub2.unsubscribe();

        service.watch(options).get(0).subscribe(() => {
          assert.equal(i, 2);
          done();
        });
      });
    });
  }
});
