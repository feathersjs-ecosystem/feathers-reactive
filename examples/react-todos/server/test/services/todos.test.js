const assert = require('assert');
const app = require('../../src/app');

describe('\'todos\' service', () => {
  it('registered the service', () => {
    const service = app.service('todos');

    assert.ok(service, 'Registered the service');
  });
});
