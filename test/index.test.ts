// @ts-nocheck

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('feathers-reactive', () => {
  it('is CommonJS compatible', async () => {
    const lib = await import('../dist/index.cjs');
    assert.equal(typeof lib.rx, 'function');
  });
  // TODO
  // it('is module compatible', async () => {
  //   const lib = await import('../dist/index.mjs');
  //   assert.equal(typeof lib.rx, 'function');
  // });
});
