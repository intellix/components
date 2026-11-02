import {describe, it, expect} from 'vitest';
import {
  MatCardImage,
  MatCardSmImage,
  MatCardMdImage,
  MatCardLgImage,
  MatCardXlImage,
} from './mat-card-image';

describe('MatCardImage family (module-import smoke)', () => {
  it('all 5 image components are Qwik components', () => {
    expect(MatCardImage).toBeDefined();
    expect(typeof MatCardImage).toBe('function');
    expect(MatCardSmImage).toBeDefined();
    expect(typeof MatCardSmImage).toBe('function');
    expect(MatCardMdImage).toBeDefined();
    expect(typeof MatCardMdImage).toBe('function');
    expect(MatCardLgImage).toBeDefined();
    expect(typeof MatCardLgImage).toBe('function');
    expect(MatCardXlImage).toBeDefined();
    expect(typeof MatCardXlImage).toBe('function');
  });
});
