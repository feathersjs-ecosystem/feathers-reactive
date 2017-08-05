import assert from 'assert';

import 'rxjs/Observable';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/do';

describe('feathers-reactive', () => {
  it('is CommonJS compatible', () => {
    assert.equal(typeof require('../src'), 'function');
  });
});
