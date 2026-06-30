import {describe, it, expect} from 'vitest';
import {createIdGenerator} from './public-api';

describe('_IdGenerator', () => {
  it('generates unique ids with the given prefix', () => {
    const g = createIdGenerator();
    const a = g.getId('cdk-dialog-');
    const b = g.getId('cdk-dialog-');
    expect(a).toMatch(/^cdk-dialog-\d+$/);
    expect(b).toMatch(/^cdk-dialog-\d+$/);
    expect(a).not.toBe(b);
  });
});
