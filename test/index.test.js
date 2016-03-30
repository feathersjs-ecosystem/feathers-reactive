import assert from 'assert';

describe('feathers-rx', () => {
  it('is CommonJS compatible', () => {
    assert.equal(typeof require('../lib'), 'function');
  });
});
