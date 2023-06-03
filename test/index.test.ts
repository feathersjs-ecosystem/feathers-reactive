import { beforeEach, describe, expect, it } from 'vitest';

describe('feathers-reactive', () => {
  it('is CommonJS compatible', async () => {
    const lib = await import('../dist/index.cjs');
    expect(typeof lib.rx).toBe('function');
  });
  it('is module compatible', async () => {
    const lib = await import('../dist/index.mjs');
    expect(typeof lib.rx).toBe('function');
  });
});
