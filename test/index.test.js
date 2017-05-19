import assert from 'assert';
// import 'rxjs';
import 'rxjs/Observable';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/filter';

describe('feathers-reactive', () => {
  it('is CommonJS compatible', () => {
    assert.equal(typeof require('../lib'), 'function');
  });
});
