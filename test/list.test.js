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
          .use('/messages', memory({ paginate: { default: 3 }}));

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

    it('.find as an observable', done => {
      service.find().first().subscribe(messages => {
        assert.deepEqual(messages, [ { text: 'A test message', [id]: 0 } ]);
        done();
      });
    });

    it('.create and .find', done => {
      service.find().skip(1).subscribe(messages => {
        assert.deepEqual(messages, [
          { text: 'A test message', [id]: 0 },
          { text: 'Another message', [id]: 1 }
        ]);
        done();
      });

      setTimeout(() => service.create({ text: 'Another message' }), 20);
    });

    it('.update and .find', done => {
      service.find().skip(1).subscribe(messages => {
        assert.deepEqual(messages, [
          { text: 'An updated test message', [id]: 0 }
        ]);
        done();
      });

      setTimeout(() => service.update(0, { text: 'An updated test message' }), 20);
    });

    it('.patch and .find', done => {
      service.find().skip(1).subscribe(messages => {
        assert.deepEqual(messages, [
          { text: 'A patched test message', [id]: 0 }
        ]);
        done();
      });

      setTimeout(() => service.patch(0, { text: 'A patched test message' }), 20);
    });

    it('.remove and .find', done => {
      service.find().skip(1).subscribe(messages => {
        assert.deepEqual(messages, []);
        done();
      });

      setTimeout(() => service.remove(0), 20);
    });

    it('.find with .create that matches', done => {
      const result = service.find({ query: { counter: 1 } });

      result.first().subscribe(messages => assert.deepEqual(messages, []));

      result.skip(1).subscribe(messages => {
        assert.deepEqual(messages, [{
          [id]: 1,
          text: 'New message',
          counter: 1
        }]);
        done();
      });

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
          assert.deepEqual(messages, createdMessages)
        );

        result.skip(1).subscribe(messages => {
          assert.deepEqual(messages, [{
            text: 'second',
            counter: 1,
            [id]: 2
          }]);
          done();
        });

        setTimeout(() => {
          service.patch(1, { counter: 2 });
        }, 20);
      });
    });
  }

  function paginationTests (id) {
    it('removes items if the data length is past the limit', done => {
      Promise.all([
        service.create({ text: 'first' }),
        service.create({ text: 'second' }),
      ]).then(() => {
        const expect = [
          {text: 'A test message', [id]: 0},
          {text: 'first', [id]: 1},
          {text: 'second', [id]: 2}
        ];
        const result = service.find();

        result.take(2).subscribe(messages => {
          assert.deepEqual(messages.data, expect);
        }, () => {}, () => done());

        setTimeout(() => {
          service.create({text: 'third'});
        }, 20);
      });
    });
  }
});
