import assert from 'assert';
import feathers from '@feathersjs/feathers';
import memory from 'feathers-memory';

import rx from '../src';

import {
  skip,
  tap,
  take
} from 'rxjs/operators';

describe('reactive resources', () => {
  let app, id, service;

  describe('standard id', function () {
    beforeEach(done => {
      app = feathers()
        .configure(rx({ idField: 'id' }))
        .use('/messages', memory({
          multi: [ 'create' ]
        }));

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
        .configure(rx({ idField: 'id' }))
        .use('/messages', memory({
          multi: [ 'create' ],
          id: 'customId'
        }));

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
        .configure(rx({ idField: 'id' }))
        .use('/messages', memory({
          multi: [ 'create' ],
          id: 'customId'
        }));

      service = app.service('messages').hooks({
        before: {
          all: [function (hook) {
            hook.params.rx = { idField: 'customId' };
          }]
        }
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
        assert.deepEqual(message, {
          [customId]: id,
          text: 'A test message'
        });
        done();
      }, done);
    });

    it('.get as an observable', done => {
      service.watch().get(id).pipe(
        take(1)
      ).subscribe(message => {
        assert.deepEqual(message, {
          [customId]: id,
          text: 'A test message'
        });
        done();
      }, done);
    });

    it('lazy execution on subscription', done => {
      let ran = false;

      app.use('/dummy', {
        get (id) {
          ran = true;

          return Promise.resolve({
            id,
            description: `Do ${id}!`
          });
        }
      });

      const source = app.service('dummy').watch().get('dishes').pipe(take(1));

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

      result.pipe(
        take(1)
      ).subscribe(message => {
        assert.deepEqual(message, {
          [customId]: id,
          text: 'A test message'
        });
        service.update(id, {
          text: 'Updated',
          prop: true
        });
      }, done);

      result.pipe(
        skip(1),
        take(1)
      ).subscribe(message => {
        assert.deepEqual(message, {
          [customId]: id,
          text: 'Updated',
          prop: true
        });
        service.patch(id, { text: 'Updated again' });
      }, done);

      result.pipe(
        skip(2),
        take(1)
      ).subscribe(message => {
        assert.deepEqual(message, {
          [customId]: id,
          text: 'Updated again',
          prop: true
        });
        done();
      }, done);
    });

    it('.remove emits null', done => {
      service.watch().get(id).pipe(take(2)).subscribe(message => {
        if (message === null) {
          done();
        } else {
          assert.deepEqual(message, {
            [customId]: id,
            text: 'A test message'
          });
        }
      }, done);

      setTimeout(() => service.remove(id));
    });

    it('injects options.pipe into observable chain (single operator)', done => {
      const options = {
        pipe: tap(() => done())
      };
      service.watch(options).get(0).pipe(take(1)).subscribe();
    });

    it('injects options.pipe into observable chain (array of operators)', done => {
      let i = 0;

      const options = {
        pipe: [
          tap(() => i++),
          tap(() => {
            assert.equal(i, 1);
            done();
          })
        ]
      };
      service.watch(options).get(0).pipe(take(1)).subscribe();
    });

    it('.get uses caching', done => {
      const o1 = service.watch().get(0);
      const o2 = service.watch().get(0);

      assert.equal(o2, o1);

      done();
    });

    it('clears cache after unsubscription', done => {
      const o1 = service.watch().get(0);
      const o2 = service.watch().get(0);

      const sub1 = o1.subscribe();
      const sub2 = o2.subscribe();

      sub1.unsubscribe();
      sub2.unsubscribe();

      assert.equal(o1, o2);
      assert.notEqual(service.watch().get(0), o1);

      done();
    });
  }
});
