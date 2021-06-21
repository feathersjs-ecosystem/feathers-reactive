import assert from 'assert';
import feathers from '@feathersjs/feathers';
import memory from 'feathers-memory';

import rx from '../src';

import {
  first,
  skip,
  tap
} from 'rxjs/operators';
import { of } from 'rxjs';

describe('reactive lists', () => {
  let app, service;

  describe('strategy.smart', function () {
    describe('default', function () {
      beforeEach(done => {
        app = feathers()
          .configure(rx({ idField: 'id' }))
          .use('/messages', memory({
            multi: [ 'create' ]
          }));

        service = app.service('messages');

        service.create({
          text: 'A test message'
        }).then(() => done());
      });

      baseTests('id');
    });
    describe('reset', function () {
      beforeEach(done => {
        app = feathers()
          .configure(rx({ idField: 'id' }))
          .use('/messages', memory({
            multi: [ 'create' ]
          }));

        service = app.service('messages');

        service.create({
          text: 'A test message'
        }).then(() => done())
      });

      it('subscriber is notified on reset', done => {
        service.watch().find().pipe(skip(1), first()).subscribe(messages => {
          assert.deepStrictEqual(messages, [{
            text: 'A test message',
            id: 0
          }]);
          done(); 
        });
        setTimeout(() => service.reset(), 20);        
      });
      it('after reset, noise data is removed', done => {
        service.watch().find().pipe(skip(1), first()).subscribe(messages => {
          // add some noize
          assert.deepStrictEqual(messages, [{
            text: 'A test message',
            id: 0
          },
          {
            text: 'fake data',
            id: 36
          }]);
        });
        service.watch().find().pipe(skip(2), first()).subscribe(messages => {
          // noize is cleared on reset
          assert.deepStrictEqual(messages, [{
            text: 'A test message',
            id: 0
          },
          ]);
        });
        service.watch().find().pipe(skip(3), first()).subscribe(messages => {
          // noize is not re-introduced
          assert.deepStrictEqual(messages, [{
            text: 'A test message',
            id: 0
          },
          {
            text: 'good data',
            id: 1
          },
          ]);
          done(); 
        });
        setTimeout(() => service.emit("created", {text: 'fake data', id: 36}), 20); // noize data
        setTimeout(() => service.reset(), 40);
        setTimeout(() => service.create({text: 'good data'}), 60);
      });
    });
    describe('custom id', function () {
      beforeEach(done => {
        app = feathers()
          .configure(rx({ idField: 'id' }))
          .use('/messages', memory({
            id: 'customId',
            multi: [ 'create' ]
          }));

        service = app.service('messages').rx({ idField: 'customId' });

        service.create({
          text: 'A test message'
        }).then(() => done());
      });

      baseTests('customId');
    });

    describe('pagination', function () {
      beforeEach(done => {
        app = feathers()
          .configure(rx({ idField: 'id' }))
          .use('/messages', memory({
            multi: [ 'create' ],
            paginate: { default: 3 }
          }));

        service = app.service('messages').rx();

        service.create({
          text: 'A test message'
        }).then(() => done());
      });

      paginationTests('id');
    });
  });

  describe('strategy.always', function () {
    describe('default', function () {
      beforeEach(done => {
        app = feathers()
          .configure(rx({
            idField: 'id',
            listStrategy: 'always'
          }))
          .use('/messages', memory({
            multi: [ 'create' ]
          }));

        service = app.service('messages').rx();

        service.create({
          text: 'A test message'
        }).then(() => done());
      });

      baseTests('id');
    });

    describe('custom id', function () {
      beforeEach(done => {
        app = feathers()
          .configure(rx({
            idField: 'id',
            listStrategy: 'always'
          }))
          .use('/messages', memory({
            multi: [ 'create' ],
            id: 'customId'
          }));

        service = app.service('messages').rx({ idField: 'customId' });

        service.create({
          text: 'A test message'
        }).then(() => done());
      });

      baseTests('customId');
    });

    describe('pagination', function () {
      beforeEach(done => {
        app = feathers()
          .configure(rx({
            idField: 'id',
            listStrategy: 'always'
          }))
          .use('/messages', memory({
            multi: [ 'create' ],
            paginate: { default: 3 }
          }));

        service = app.service('messages').rx();

        service.create({
          text: 'A test message'
        }).then(() => done());
      });

      paginationTests('id');
    });
  });

  function baseTests (id) {
    it('.find is promise compatible', done => {
      service.find().then(messages => {
        assert.deepEqual(messages, [{
          text: 'A test message',
          [id]: 0
        }]);
        done();
      });
    });

    it('lazy execution on subscription', done => {
      const fixture = [
        {
          id: 0,
          text: 'first'
        },
        {
          id: 1,
          text: 'second'
        }
      ];

      let ran = false;

      app.use('/dummy', {
        find () {
          ran = true;

          return Promise.resolve(fixture);
        }
      });

      const source = app.service('dummy').watch().find().pipe(first());

      assert.ok(!ran);

      source.subscribe(data => {
        assert.deepEqual(data, fixture);
        assert.ok(ran);
        done();
      }, done);
    });

    it('.find as an observable', done => {
      service.watch().find().pipe(first()).subscribe(messages => {
        assert.deepEqual(messages, [{
          text: 'A test message',
          [id]: 0
        }]);
        done();
      }, done);
    });

    it('.create and .find', done => {
      service.watch().find().pipe(skip(2), first()).subscribe(messages => {
        assert.deepEqual(messages, [
          {
            text: 'A test message',
            [id]: 0
          },
          {
            text: 'Another message',
            [id]: 1
          },
          {
            text: 'Another message',
            [id]: 2
          }
        ]);
        done();
      }, done);

      setTimeout(() => service.create({ text: 'Another message' }), 20);
      setTimeout(() => service.create({ text: 'Another message' }), 40);
    });

    it('.update and .find', done => {
      service.watch().find().pipe(skip(1), first()).subscribe(messages => {
        assert.deepEqual(messages, [
          {
            text: 'An updated test message',
            [id]: 0
          }
        ]);
        done();
      }, done);

      setTimeout(() => service.update(0, { text: 'An updated test message' }), 20);
    });

    it('.patch and .find', done => {
      service.watch().find().pipe(skip(1), first()).subscribe(messages => {
        assert.deepEqual(messages, [
          {
            text: 'A patched test message',
            [id]: 0
          }
        ]);
        done();
      }, done);

      setTimeout(() => service.patch(0, { text: 'A patched test message' }), 20);
    });

    it('.remove and .find', done => {
      service.watch().find().pipe(skip(1), first()).subscribe(messages => {
        assert.deepEqual(messages, []);
        done();
      }, done);

      setTimeout(() => service.remove(0), 20);
    });

    it('.find with .create that matches', done => {
      const result = service.watch().find({ query: { counter: 1 } });

      result.pipe(first()).subscribe(messages => assert.deepEqual(messages, []), done);

      result.pipe(skip(1), first()).subscribe(messages => {
        assert.deepEqual(messages, [{
          [id]: 1,
          text: 'New message',
          counter: 1
        }]);
        done();
      }, done);

      setTimeout(() => {
        service.create([{
          text: 'New message',
          counter: 1
        }, {
          text: 'Other message',
          counter: 2
        }]);
      }, 20);
    });

    it('.find with $sort, .create and .patch', done => {
      const result = service.watch().find({
        query: {
          $sort: { text: -1 }
        }
      });

      result.pipe(
        skip(1),
        first()
      ).subscribe(messages => {
        assert.deepEqual(messages, [{
          [id]: 1,
          text: 'B test message'
        }, {
          [id]: 0,
          text: 'A test message'
        }]);
      }, done);

      result.pipe(
        skip(2),
        first()
      ).subscribe(messages => {
        assert.deepEqual(messages, [{
          [id]: 0,
          text: 'Updated test message'
        }, {
          [id]: 1,
          text: 'B test message'
        }]);

        done();
      }, done);

      setTimeout(() => {
        service.create({
          text: 'B test message'
        }).then(() => {
          setTimeout(() => {
            service.patch(0, {
              text: 'Updated test message'
            });
          }, 20);
        });
      }, 20);
    });

    it('removes item after .update/.patch if it does not match', done => {
      Promise.all([
        service.create({
          text: 'first',
          counter: 1
        }),
        service.create({
          text: 'second',
          counter: 1
        })
      ]).then(createdMessages => {
        const result = service.watch().find({ query: { counter: 1 } });

        result.pipe(first()).subscribe(messages =>
          assert.deepEqual(messages, createdMessages),
        done);

        result.pipe(skip(1), first()).subscribe(messages => {
          assert.deepEqual(messages, [{
            text: 'second',
            counter: 1,
            [id]: 2
          }]);
          done();
        }, done);

        setTimeout(() => {
          service.patch(1, { counter: 2 });
        }, 20);
      });
    });

    it('adds item back after .update/.patch if it matches again', done => {
      Promise.all([
        service.create({
          text: 'first',
          counter: 1
        }),
        service.create({
          text: 'second',
          counter: 1
        })
      ]).then(createdMessages => {
        const result = service.watch().find({ query: { counter: 1 } });

        result.pipe(first()).subscribe(messages =>
          assert.deepEqual(messages, createdMessages),
        done);

        result.pipe(skip(2), first()).subscribe(messages => {
          assert.deepEqual(messages, [{
            text: 'first',
            counter: 1,
            [id]: 1
          }, {
            text: 'second',
            counter: 1,
            [id]: 2
          }]);
          done();
        }, done);

        setTimeout(() => {
          service.patch(1, { counter: 2 }).then(
            () => service.patch(1, { counter: 1 })
          );
        }, 20);
      });
    });
  }

  function paginationTests (id) {
    it('removes items if the data length is past the limit', done => {
      const expect = [
        {
          text: 'A test message',
          [id]: 0
        },
        {
          text: 'first',
          [id]: 1
        },
        {
          text: 'second',
          [id]: 2
        }
      ];
      const result = service.watch().find();

      result.pipe(skip(3), first()).subscribe(messages => {
        assert.deepEqual(messages.data, expect);
        done();
      }, done);

      setTimeout(() => {
        service.create({ text: 'first' });
        service.create({ text: 'second' });
        service.create({ text: 'third' });
      }, 20);
    });

    it('.create updates total', done => {
      service.watch().find().pipe(first()).subscribe(data => {
        assert.deepEqual(data, {
          total: 1,
          limit: 3,
          skip: 0,
          data: [
            {
              text: 'A test message',
              id: 0
            }
          ]
        });
      }, done);

      service.watch().find().pipe(skip(2), first()).subscribe(data => {
        assert.deepEqual(data, {
          total: 3,
          limit: 3,
          skip: 0,
          data: [
            {
              text: 'A test message',
              [id]: 0
            },
            {
              text: 'first',
              [id]: 1
            },
            {
              text: 'second',
              [id]: 2
            }
          ]
        });
        done();
      }, done);

      setTimeout(() => {
        service.create({ text: 'first' });
        service.create({ text: 'second' });
      }, 20);
    });

    it('.remove updates total', done => {
      service.watch().find().pipe(first()).subscribe(data => {
        assert.deepEqual(data, {
          total: 1,
          limit: 3,
          skip: 0,
          data: [
            {
              text: 'A test message',
              id: 0
            }
          ]
        });
      }, done);

      service.watch().find().pipe(skip(1), first()).subscribe(data => {
        assert.deepEqual(data, {
          total: 0,
          limit: 3,
          skip: 0,
          data: []
        });
        done();
      }, done);

      setTimeout(() => service.remove(0), 20);
    });

    it('update to matching query updates total', done => {
      const empty = {
        total: 0,
        limit: 3,
        skip: 0,
        data: []
      };
      const text = 'updated text';

      service.watch().find({ query: { text } }).pipe(
        first()
      ).subscribe(data => assert.deepEqual(data, empty), done);

      service.watch().find({ query: { text } }).pipe(
        skip(1),
        first()
      ).subscribe(data => {
        assert.deepEqual(data, {
          total: 1,
          limit: 3,
          skip: 0,
          data: [
            {
              [id]: 0,
              text: 'updated text'
            }
          ]
        });
        setTimeout(() => service.patch(0, { text: 'changed again' }));
      }, done);

      service.watch().find({ query: { text } }).pipe(
        skip(2),
        first()
      ).subscribe(data => {
        assert.deepEqual(data, empty);
        done();
      }, done);

      setTimeout(() => service.patch(0, { text }));
    });

    it('injects options.pipe into observable chain (single operator)', done => {
      const options = {
        pipe: tap(() => done())
      };
      service.watch(options).find().pipe(first()).subscribe();
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
      service.watch(options).find().pipe(first()).subscribe();
    });

    it('.find uses caching', done => {
      const o1 = service.watch().find();
      const o2 = service.watch().find();

      assert.equal(o2, o1);

      done();
    });

    it('clears cache after unsubscription', done => {
      const o1 = service.watch().find();
      const o2 = service.watch().find();

      const sub1 = o1.subscribe();
      const sub2 = o2.subscribe();

      sub1.unsubscribe();
      sub2.unsubscribe();

      assert.equal(o1, o2);
      assert.notEqual(service.watch().find(), o1);

      done();
    });
  }
});
