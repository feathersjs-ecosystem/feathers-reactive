import assert from 'assert';

describe('feathers-reactive', () => {
  it('is CommonJS compatible', () => {
    assert.equal(typeof require('../src'), 'function');
  });
});
