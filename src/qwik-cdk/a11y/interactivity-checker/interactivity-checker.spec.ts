import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {createInteractivityChecker} from '../public-api';

describe('InteractivityChecker', () => {
  let checker: InteractivityChecker;
  let host: HTMLElement;

  beforeEach(() => {
    checker = createInteractivityChecker();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.removeChild(host);
  });

  it('detects disabled inputs', () => {
    host.innerHTML = '<input disabled>';
    const input = host.querySelector('input')!;
    expect(checker.isDisabled(input)).toBe(true);
  });

  it('detects visibility', () => {
    host.innerHTML = '<button>x</button>';
    const btn = host.querySelector('button')!;
    // happy-dom does not implement computed styles; stub getComputedStyle to return 'visible'.
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({visibility: 'visible'} as any);
    expect(checker.isVisible(btn)).toBe(true);
  });
});
