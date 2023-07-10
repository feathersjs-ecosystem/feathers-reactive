import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('feathers-reactive', () => {
  it('is CommonJS compatible', async () => {
    //@ts-ignore
    const lib = await import('../dist/index.cjs');
    assert.equal(typeof lib.rx, 'function');
  });
});
