import assert from 'assert';
import * as utils from '../src/utils';

describe('feathers-reactive utils', () => {
  it('promisify', done => {
    let promise = Promise.resolve('Hi');
    let obj = { test: 'me' };

    obj = utils.promisify(obj, promise);

    assert.equal(typeof obj.then, 'function');
    assert.equal(typeof obj.catch, 'function');
    assert.deepEqual(obj, { test: 'me' });

    obj.then(result => {
      assert.equal(result, 'Hi');
      done();
    }).catch(done);
  });
});
