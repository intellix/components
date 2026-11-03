/**
 * Ported from `src/cdk/clipboard/clipboard.spec.ts` + `copy-to-clipboard.spec.ts`'s
 * non-Angular-specific assertions. happy-dom (this package's vitest `environment`) doesn't
 * implement `document.execCommand` at all (real `document.execCommand` is a deprecated API
 * every current browser engine still implements, but neither jsdom nor happy-dom emulates a
 * real selection-to-clipboard copy) — these tests install a stub for it directly, same as
 * upstream's own spec does with a spy.
 */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {beginCopyToClipboard, copyToClipboard} from './clipboard';

describe('copyToClipboard / beginCopyToClipboard', () => {
  let execCommandSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    execCommandSpy = vi.fn().mockReturnValue(true);
    (document as any).execCommand = execCommandSpy;
  });

  afterEach(() => {
    delete (document as any).execCommand;
  });

  it('copies text via a temporary textarea and returns the execCommand result', () => {
    const successful = copyToClipboard('Hello world');
    expect(successful).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
  });

  it('removes the temporary textarea after copying', () => {
    copyToClipboard('Hello world');
    expect(document.querySelectorAll('textarea[aria-hidden="true"]').length).toBe(0);
  });

  it('beginCopyToClipboard lets the caller defer the actual copy', () => {
    const pending = beginCopyToClipboard('Deferred text');
    expect(document.querySelectorAll('textarea[aria-hidden="true"]').length).toBe(1);

    const successful = pending.copy();
    expect(successful).toBe(true);
    pending.destroy();
    expect(document.querySelectorAll('textarea[aria-hidden="true"]').length).toBe(0);
  });

  it('reports failure when execCommand fails', () => {
    execCommandSpy.mockReturnValue(false);
    expect(copyToClipboard('nope')).toBe(false);
  });

  it('reports failure when execCommand throws', () => {
    execCommandSpy.mockImplementation(() => {
      throw new Error('not supported');
    });
    expect(copyToClipboard('nope')).toBe(false);
  });

  it('restores the previously-focused element after copying', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(document.activeElement).toBe(input);

    copyToClipboard('Hello world');

    expect(document.activeElement).toBe(input);
    input.remove();
  });
});
