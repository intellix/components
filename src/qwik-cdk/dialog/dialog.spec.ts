import {describe, it, expect} from 'vitest';
import {useDialog, createDialogService} from './public-api';

// Note: DOM-render tests (createDOM + userEvent) hang at runtime due to a
// Qwik testing library limitation observed in Tasks 18 and 20.
// We use module-import shape assertions instead.

describe('useDialog', () => {
  it('exports useDialog hook and createDialogService factory', () => {
    expect(typeof useDialog).toBe('function');
    expect(typeof createDialogService).toBe('function');
  });
});
