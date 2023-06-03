import { feathers } from '@feathersjs/feathers';
import memory from 'feathers-memory';
import { first, skip, tap } from 'rxjs/operators';
import { beforeEach, describe, expect, it } from 'vitest';

import { rx } from '../src';

describe('reactive lists', () => {
  let app, service;

  describe('strategy.smart', function () {
    describe('default', function () {
      beforeEach(async () => {
        app = feathers();
        app.configure(rx({ idField: 'id' }));
        app.use(
          '/messages',
          memory({
            multi: ['create']
          })
        );

        service = app.service('messages');
        await app.setup();
        await service.create({
          text: 'A test message'
        });
      });

      baseTests('id');
    });
    describe('reset', function () {
      beforeEach(async () => {
        app = feathers()
          .configure(rx({ idField: 'id' }))
          .use(
            '/messages',
            memory({
              multi: ['create']
            })
          );

        service = app.service('messages');

        await service.create({
          text: 'A test message'
        });
      });

      it('subscriber is notified on reset', () =>
        new Promise<void>((done) => {
          service
            .watch()
            .find()
            .pipe(skip(1), first())
            .subscribe((messages) => {
              expect(messages).toStrictEqual([
                {
                  text: 'A test message',
                  id: 0
                }
              ]);
              done();
            });
          setTimeout(() => service.reset(), 20);
        }));
      it('after reset, noise data is removed', () =>
        new Promise<void>((done) => {
          service
            .watch()
            .find()
            .pipe(skip(1), first())
            .subscribe((messages) => {
              // add some noize
              expect(messages).toStrictEqual([
                {
                  text: 'A test message',
                  id: 0
                },
                {
                  text: 'fake data',
                  id: 36
                }
              ]);
            });
          service
            .watch()
            .find()
            .pipe(skip(2), first())
            .subscribe((messages) => {
              // noize is cleared on reset
              expect(messages).toStrictEqual([
                {
                  text: 'A test message',
                  id: 0
                }
              ]);
            });
          service
            .watch()
            .find()
            .pipe(skip(3), first())
            .subscribe((messages) => {
              // noize is not re-introduced
              expect(messages).toStrictEqual([
                {
                  text: 'A test message',
                  id: 0
                },
                {
                  text: 'good data',
                  id: 1
                }
              ]);
              done();
            });
          setTimeout(
            () => service.emit('created', { text: 'fake data', id: 36 }),
            20
          ); // noize data
          setTimeout(() => service.reset(), 40);
          setTimeout(() => service.create({ text: 'good data' }), 60);
        }));
    });
    describe('custom id', function () {
      beforeEach(async () => {
        app = feathers()
          .configure(rx({ idField: 'id' }))
          .use(
            '/messages',
            memory({
              id: 'customId',
              multi: ['create']
            })
          );

        service = app.service('messages').rx({ idField: 'customId' });

        await service.create({
          text: 'A test message'
        });
      });

      baseTests('customId');
    });

    describe('pagination', function () {
      beforeEach(async () => {
        app = feathers()
          .configure(rx({ idField: 'id' }))
          .use(
            '/messages',
            memory({
              multi: ['create'],
              paginate: { default: 3 }
            })
          );

        service = app.service('messages').rx();

        await service.create({
          text: 'A test message'
        });
      });

      paginationTests('id');
    });

    describe('race conditions', function () {
      beforeEach(
        () =>
          new Promise<void>((done) => {
            app = feathers()
              .configure(rx({ idField: 'id' }))
              .use(
                '/messages',
                memory({
                  multi: ['create']
                })
              );

            done();
          })
      );

      it('patch before create event', () =>
        new Promise<void>((done) => {
          const now = new Date();
          service = app.service('messages');
          service.hooks({
            after: {
              create: [
                (context) =>
                  service
                    .patch(context.result.id, { createdAt: now.toISOString() })
                    .then((result) => context)
              ]
            }
          });

          service
            .watch()
            .find()
            .pipe(skip(2), first())
            .subscribe((messages) => {
              expect(messages).toStrictEqual([
                {
                  createdAt: now.toISOString(),
                  text: 'A test message',
                  id: 0
                }
              ]);
              done();
            }, done);

          setTimeout(() => service.create({ text: 'A test message' }), 20);
        }));

      it('update before create event', () =>
        new Promise<void>((done) => {
          const now = new Date();
          service = app.service('messages');
          service.hooks({
            after: {
              create: [
                (context) =>
                  service
                    .update(context.result.id, {
                      text: 'An updated test message',
                      createdAt: now.toISOString()
                    })
                    .then((result) => context)
              ]
            }
          });

          service
            .watch()
            .find()
            .pipe(skip(2), first())
            .subscribe((messages) => {
              expect(messages).toStrictEqual([
                {
                  createdAt: now.toISOString(),
                  text: 'An updated test message',
                  id: 0
                }
              ]);
              done();
            }, done);

          setTimeout(() => service.create({ text: 'A test message' }), 20);
        }));
    });
  });

  describe('strategy.always', function () {
    describe('default', function () {
      beforeEach(async () => {
        app = feathers()
          .configure(
            rx({
              idField: 'id',
              listStrategy: 'always'
            })
          )
          .use(
            '/messages',
            memory({
              multi: ['create']
            })
          );

        service = app.service('messages').rx();

        await service.create({
          text: 'A test message'
        });
      });

      baseTests('id');
    });

    describe('custom id', function () {
      beforeEach(async () => {
        app = feathers()
          .configure(
            rx({
              idField: 'id',
              listStrategy: 'always'
            })
          )
          .use(
            '/messages',
            memory({
              multi: ['create'],
              id: 'customId'
            })
          );

        service = app.service('messages').rx({ idField: 'customId' });

        await service.create({
          text: 'A test message'
        });
      });

      baseTests('customId');
    });

    describe('pagination', function () {
      beforeEach(async () => {
        app = feathers()
          .configure(
            rx({
              idField: 'id',
              listStrategy: 'always'
            })
          )
          .use(
            '/messages',
            memory({
              multi: ['create'],
              paginate: { default: 3 }
            })
          );

        service = app.service('messages').rx();

        await service.create({
          text: 'A test message'
        });
      });

      paginationTests('id');
    });
  });

  function baseTests(id) {
    it('.find is promise compatible', () =>
      new Promise<void>((done) => {
        service.find().then((messages) => {
          expect(messages).toStrictEqual([
            {
              text: 'A test message',
              [id]: 0
            }
          ]);
          done();
        });
      }));

    it('lazy execution on subscription', () =>
      new Promise<void>((done) => {
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
          find() {
            ran = true;

            return Promise.resolve(fixture);
          }
        });

        const source = app.service('dummy').watch().find().pipe(first());

        expect(ran).toBe(false);

        source.subscribe((data) => {
          expect(data).toStrictEqual(fixture);
          expect(ran).toBe(true);
          done();
        }, done);
      }));

    it('.find as an observable', () =>
      new Promise<void>((done) => {
        service
          .watch()
          .find()
          .pipe(first())
          .subscribe((messages) => {
            expect(messages).toStrictEqual([
              {
                text: 'A test message',
                [id]: 0
              }
            ]);
            done();
          }, done);
      }));

    it('.create and .find', () =>
      new Promise<void>((done) => {
        service
          .watch()
          .find()
          .pipe(skip(2), first())
          .subscribe((messages) => {
            expect(messages).toStrictEqual([
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
      }));

    it('.update and .find', () =>
      new Promise<void>((done) => {
        service
          .watch()
          .find()
          .pipe(skip(1), first())
          .subscribe((messages) => {
            expect(messages).toStrictEqual([
              {
                text: 'An updated test message',
                [id]: 0
              }
            ]);
            done();
          }, done);

        setTimeout(
          () => service.update(0, { text: 'An updated test message' }),
          20
        );
      }));

    it('.patch and .find', () =>
      new Promise<void>((done) => {
        service
          .watch()
          .find()
          .pipe(skip(1), first())
          .subscribe((messages) => {
            expect(messages).toStrictEqual([
              {
                text: 'A patched test message',
                [id]: 0
              }
            ]);
            done();
          }, done);

        setTimeout(
          () => service.patch(0, { text: 'A patched test message' }),
          20
        );
      }));

    it('.remove and .find', () =>
      new Promise<void>((done) => {
        service
          .watch()
          .find()
          .pipe(skip(1), first())
          .subscribe((messages) => {
            expect(messages).toStrictEqual([]);
            done();
          }, done);

        setTimeout(() => service.remove(0), 20);
      }));

    it('.find with .create that matches', () =>
      new Promise<void>((done) => {
        const result = service.watch().find({ query: { counter: 1 } });

        result
          .pipe(first())
          .subscribe((messages) => expect(messages).toStrictEqual([]), done);

        result.pipe(skip(1), first()).subscribe((messages) => {
          expect(messages).toStrictEqual([
            {
              [id]: 1,
              text: 'New message',
              counter: 1
            }
          ]);
          done();
        }, done);

        setTimeout(() => {
          service.create([
            {
              text: 'New message',
              counter: 1
            },
            {
              text: 'Other message',
              counter: 2
            }
          ]);
        }, 20);
      }));

    it('.find with $sort, .create and .patch', () =>
      new Promise<void>((done) => {
        const result = service.watch().find({
          query: {
            $sort: { text: -1 }
          }
        });

        result.pipe(skip(1), first()).subscribe((messages) => {
          expect(messages).toStrictEqual([
            {
              [id]: 1,
              text: 'B test message'
            },
            {
              [id]: 0,
              text: 'A test message'
            }
          ]);
        }, done);

        result.pipe(skip(2), first()).subscribe((messages) => {
          expect(messages).toStrictEqual([
            {
              [id]: 0,
              text: 'Updated test message'
            },
            {
              [id]: 1,
              text: 'B test message'
            }
          ]);

          done();
        }, done);

        setTimeout(() => {
          service
            .create({
              text: 'B test message'
            })
            .then(() => {
              setTimeout(() => {
                service.patch(0, {
                  text: 'Updated test message'
                });
              }, 20);
            });
        }, 20);
      }));

    it('removes item after .update/.patch if it does not match', () =>
      new Promise<void>((done) => {
        Promise.all([
          service.create({
            text: 'first',
            counter: 1
          }),
          service.create({
            text: 'second',
            counter: 1
          })
        ]).then((createdMessages) => {
          const result = service.watch().find({ query: { counter: 1 } });

          result
            .pipe(first())
            .subscribe(
              (messages) => expect(messages).toStrictEqual(createdMessages),
              done
            );

          result.pipe(skip(1), first()).subscribe((messages) => {
            expect(messages).toStrictEqual([
              {
                text: 'second',
                counter: 1,
                [id]: 2
              }
            ]);
            done();
          }, done);

          setTimeout(() => {
            service.patch(1, { counter: 2 });
          }, 20);
        });
      }));

    it('adds item back after .update/.patch if it matches again', () =>
      new Promise<void>((done) => {
        Promise.all([
          service.create({
            text: 'first',
            counter: 1
          }),
          service.create({
            text: 'second',
            counter: 1
          })
        ]).then((createdMessages) => {
          const result = service.watch().find({ query: { counter: 1 } });

          result
            .pipe(first())
            .subscribe(
              (messages) => expect(messages).toStrictEqual(createdMessages),
              done
            );

          result.pipe(skip(2), first()).subscribe((messages) => {
            expect(messages).toStrictEqual([
              {
                text: 'first',
                counter: 1,
                [id]: 1
              },
              {
                text: 'second',
                counter: 1,
                [id]: 2
              }
            ]);
            done();
          }, done);

          setTimeout(() => {
            service
              .patch(1, { counter: 2 })
              .then(() => service.patch(1, { counter: 1 }));
          }, 20);
        });
      }));
  }

  function paginationTests(id) {
    it('removes items if the data length is past the limit', () =>
      new Promise<void>((done) => {
        const expected = [
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

        result.pipe(skip(3), first()).subscribe((messages) => {
          expect(messages.data).toStrictEqual(expected);
          done();
        }, done);

        setTimeout(() => {
          service.create({ text: 'first' });
          service.create({ text: 'second' });
          service.create({ text: 'third' });
        }, 20);
      }));

    it('.create updates total', () =>
      new Promise<void>((done) => {
        service
          .watch()
          .find()
          .pipe(first())
          .subscribe((data) => {
            expect(data).toStrictEqual({
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

        service
          .watch()
          .find()
          .pipe(skip(2), first())
          .subscribe((data) => {
            expect(data).toStrictEqual({
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
      }));

    it('.remove updates total', () =>
      new Promise<void>((done) => {
        service
          .watch()
          .find()
          .pipe(first())
          .subscribe((data) => {
            expect(data).toStrictEqual({
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

        service
          .watch()
          .find()
          .pipe(skip(1), first())
          .subscribe((data) => {
            expect(data).toStrictEqual({
              total: 0,
              limit: 3,
              skip: 0,
              data: []
            });
            done();
          }, done);

        setTimeout(() => service.remove(0), 20);
      }));

    it('update to matching query updates total', () =>
      new Promise<void>((done) => {
        const empty = {
          total: 0,
          limit: 3,
          skip: 0,
          data: []
        };
        const text = 'updated text';

        service
          .watch()
          .find({ query: { text } })
          .pipe(first())
          .subscribe((data) => expect(data).toStrictEqual(empty), done);

        service
          .watch()
          .find({ query: { text } })
          .pipe(skip(1), first())
          .subscribe((data) => {
            expect(data).toStrictEqual({
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

        service
          .watch()
          .find({ query: { text } })
          .pipe(skip(2), first())
          .subscribe((data) => {
            expect(data).toStrictEqual(empty);
            done();
          }, done);

        setTimeout(() => service.patch(0, { text }));
      }));

    it('injects options.pipe into observable chain (single operator)', () =>
      new Promise<void>((done) => {
        const options = {
          pipe: tap(() => done())
        };
        service.watch(options).find().pipe(first()).subscribe();
      }));

    it('injects options.pipe into observable chain (array of operators)', () =>
      new Promise<void>((done) => {
        let i = 0;

        const options = {
          pipe: [
            tap(() => i++),
            tap(() => {
              expect(i).toBe(1);
              done();
            })
          ]
        };
        service.watch(options).find().pipe(first()).subscribe();
      }));

    it('.find uses caching', () =>
      new Promise<void>((done) => {
        const o1 = service.watch().find();
        const o2 = service.watch().find();

        expect(o2).toStrictEqual(o1);

        done();
      }));

    it('clears cache after unsubscription', () =>
      new Promise<void>((done) => {
        const o1 = service.watch().find();
        const o2 = service.watch().find();

        const sub1 = o1.subscribe();
        const sub2 = o2.subscribe();

        sub1.unsubscribe();
        sub2.unsubscribe();

        expect(o1).toEqual(o2);
        expect(service.watch().find()).not.toEqual(o2);

        done();
      }));
  }
});
