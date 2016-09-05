import assert from 'assert';
import Rx from 'rxjs';
import { promisify } from '../src/utils';

describe('feathers-reactive utils', () => {
  it('promisify .then', done => {
    const stream = promisify(Rx.Observable.from([ 'test' ]));

    stream.then(result => {
      assert.equal(result, 'test');
      done();
    }).catch(done);
  });

  it('promisify .catch', done => {
    const source = Rx.Observable.create(
      observer => observer.error(new Error('Something went wrong'))
    );
    const stream = promisify(source);

    stream.then(() => done(new Error('Should never get here')))
      .catch(error => {
        assert.equal(error.message, 'Something went wrong');
        done();
      })
      .catch(done);
  });
});
