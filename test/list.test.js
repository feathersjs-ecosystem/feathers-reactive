import Rx from 'rxjs/Rx';
import assert from 'assert';
import feathers from 'feathers';
import memory from 'feathers-memory';

import rx from '../src';

describe('reactive lists', () => {
  let app, service;

  describe('strategy.smart', function() {
    describe('default', function () {
      beforeEach(done => {
        app = feathers()
          .configure(rx(Rx))
          .use('/messages', memory());

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
          .configure(rx(Rx))
          .use('/messages', memory({ idField: 'customId' }));

        service = app.service('messages').rx({idField: 'customId'});

        service.create({
          text: 'A test message'
        }).then(() => done());
      });

      baseTests('customId');
    });

    describe('pagination', function () {
      beforeEach(done => {
        app = feathers()
          .configure(rx(Rx))
          .use('/messages', memory({ paginate: { default: 3 } }));

        service = app.service('messages').rx();

        service.create({
          text: 'A test message'
        }).then(() => done());
      });

      paginationTests('id');
    });
  });

  describe('strategy.always', function() {
    describe('default', function () {
      beforeEach(done => {
        app = feathers()
          .configure(rx(Rx, {
            listStrategy: 'always'
          }))
          .use('/messages', memory());

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
          .configure(rx(Rx, {
            listStrategy: 'always'
          }))
          .use('/messages', memory({ idField: 'customId' }));

        service = app.service('messages').rx({idField: 'customId'});

        service.create({
          text: 'A test message'
        }).then(() => done());
      });

      baseTests('customId');
    });

    describe('pagination', function () {
      beforeEach(done => {
        app = feathers()
          .configure(rx(Rx, {
            listStrategy: 'always'
          }))
          .use('/messages', memory({ paginate: { default: 3 }}));

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
        assert.deepEqual(messages, [ { text: 'A test message', [id]: 0 } ]);
        done();
      });
    });

    it('lazy execution on subscription', done => {
      const fixture = [
        { id: 0, text: 'first' },
        { id: 1, text: 'second' }
      ];

      let ran = false;

      app.use('/dummy', {
        find() {
          ran = true;

          return Promise.resolve(fixture);
        }
      });

      const source = app.service('dummy').find({
        rx: { lazy: true }
      });

      assert.ok(!ran);

      source.subscribe(data => {
        assert.deepEqual(data, fixture);
        assert.ok(ran);
        done();
      }, done);
    });

    it('.find as an observable', done => {
      service.find().first().subscribe(messages => {
        assert.deepEqual(messages, [ { text: 'A test message', [id]: 0 } ]);
        done();
      }, done);
    });

    it('.create and .find', done => {
      service.find().skip(1).subscribe(messages => {
        assert.deepEqual(messages, [
          { text: 'A test message', [id]: 0 },
          { text: 'Another message', [id]: 1 }
        ]);
        done();
      }, done);

      setTimeout(() => service.create({ text: 'Another message' }), 20);
    });

    it('.update and .find', done => {
      service.find().skip(1).subscribe(messages => {
        assert.deepEqual(messages, [
          { text: 'An updated test message', [id]: 0 }
        ]);
        done();
      }, done);

      setTimeout(() => service.update(0, { text: 'An updated test message' }), 20);
    });

    it('.patch and .find', done => {
      service.find().skip(1).subscribe(messages => {
        assert.deepEqual(messages, [
          { text: 'A patched test message', [id]: 0 }
        ]);
        done();
      }, done);

      setTimeout(() => service.patch(0, { text: 'A patched test message' }), 20);
    });

    it('.remove and .find', done => {
      service.find().skip(1).subscribe(messages => {
        assert.deepEqual(messages, []);
        done();
      }, done);

      setTimeout(() => service.remove(0), 20);
    });

    it('.find with .create that matches', done => {
      const result = service.find({ query: { counter: 1 } });

      result.first().subscribe(messages => assert.deepEqual(messages, []), done);

      result.skip(1).subscribe(messages => {
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
      const result = service.find({ query: { $sort: { text: -1 } } });

      result.skip(1).first().subscribe(messages => {
        assert.deepEqual(messages, [{
          [id]: 1,
          text: 'B test message'
        }, {
          [id]: 0,
          text: 'A test message'
        }]);
      }, done);

      result.skip(2).first().subscribe(messages => {
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
        service.create({ text: 'first', counter: 1 }),
        service.create({ text: 'second', counter: 1 })
      ]).then(createdMessages => {
        const result = service.find({ query: { counter: 1 } });

        result.first().subscribe(messages =>
          assert.deepEqual(messages, createdMessages),
        done);

        result.skip(1).subscribe(messages => {
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
        service.create({ text: 'first', counter: 1 }),
        service.create({ text: 'second', counter: 1 })
      ]).then(createdMessages => {
        const result = service.find({ query: { counter: 1 } });

        result.first().subscribe(messages =>
          assert.deepEqual(messages, createdMessages),
        done);

        result.skip(2).subscribe(messages => {
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
        { text: 'A test message', [id]: 0 },
        { text: 'first', [id]: 1 },
        { text: 'second', [id]: 2 }
      ];
      const result = service.find();

      result.skip(3).subscribe(messages => {
        assert.deepEqual(messages.data, expect);
        done();
      }, done);

      setTimeout(() => {
        service.create({ text: 'first' });
        service.create({ text: 'second' });
        service.create({text: 'third'});
      }, 20);
    });

    it('.create updates total', done => {
      service.find().first().subscribe(data => {
        assert.deepEqual(data, {
          total: 1,
          limit: 3,
          skip: 0,
          data: [
            { text: 'A test message', id: 0 }
          ]
        });
      }, done);

      service.find().skip(2).subscribe(data => {
        assert.deepEqual(data, {
          total: 3,
          limit: 3,
          skip: 0,
          data: [
            { text: 'A test message', [id]: 0 },
            { text: 'first', [id]: 1 },
            { text: 'second', [id]: 2 }
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
      service.find().first().subscribe(data => {
        assert.deepEqual(data, {
          total: 1,
          limit: 3,
          skip: 0,
          data: [
            { text: 'A test message', id: 0 }
          ]
        });
      }, done);

      service.find().skip(1).subscribe(data => {
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

      service.find({ query: { text } }).first()
        .subscribe(data => assert.deepEqual(data, empty), done);

      service.find({ query: { text } }).skip(1).first().subscribe(data => {
        assert.deepEqual(data, {
          total: 1,
          limit: 3,
          skip: 0,
          data: [
            { [id]: 0, text: 'updated text' }
          ]
        });
        setTimeout(() => service.patch(0, { text: 'changed again' }));
      }, done);

      service.find({ query: { text } }).skip(2).first().subscribe(data => {
        assert.deepEqual(data, empty);
        done();
      }, done);

      setTimeout(() => service.patch(0, { text }));
    });
  }
});
