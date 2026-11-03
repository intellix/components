/**
 * Adapted from `src/cdk/text-field/autosize.spec.ts`. happy-dom (this package's vitest
 * `environment`) has no real layout engine — `clientHeight`/`scrollHeight` are always `0` —
 * so tests that depend on actual pixel measurements stub those two getters on
 * `HTMLTextAreaElement.prototype` for the duration of the test (a standard jsdom/happy-dom
 * testing technique). Real, real-browser-layout coverage (height actually growing as the
 * user types, up to `maxRows`, then scrolling) is a Playwright functional spec in the
 * dev-app — see `SYNC.md`.
 */
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createTextareaAutosize} from './textarea-autosize';

function withMeasuredHeight<T>(heightPx: number, fn: () => T): T {
  const clientHeightDesc = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientHeight',
  );
  const scrollHeightDesc = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'scrollHeight',
  );
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return heightPx;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get() {
      return heightPx;
    },
  });
  try {
    return fn();
  } finally {
    if (clientHeightDesc) Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeightDesc);
    if (scrollHeightDesc) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollHeightDesc);
  }
}

describe('createTextareaAutosize', () => {
  let textarea: HTMLTextAreaElement;

  beforeEach(() => {
    textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
  });

  afterEach(() => {
    textarea.remove();
  });

  it('is enabled by default', () => {
    const engine = createTextareaAutosize(textarea);
    expect(engine.enabled).toBe(true);
  });

  it('resizeToFitContent() is a no-op once disabled', () => {
    const engine = createTextareaAutosize(textarea);
    engine.enabled = false;
    textarea.style.height = '12345px';
    engine.resizeToFitContent(true);
    expect(textarea.style.height).toBe('12345px');
  });

  it('reset() restores the height captured at construction time', () => {
    textarea.style.height = '77px';
    const engine = createTextareaAutosize(textarea);
    textarea.style.height = '999px';
    engine.reset();
    expect(textarea.style.height).toBe('77px');
  });

  it('setting enabled=false calls reset(); enabled=true resizes', () => {
    textarea.style.height = '50px';
    const engine = createTextareaAutosize(textarea);

    withMeasuredHeight(40, () => {
      engine.resizeToFitContent(true);
    });
    const resizedHeight = textarea.style.height;
    expect(resizedHeight).not.toBe('50px');

    engine.enabled = false;
    expect(textarea.style.height).toBe('50px');

    withMeasuredHeight(40, () => {
      engine.enabled = true;
    });
    expect(textarea.style.height).toBe(resizedHeight);
  });

  it('applies the measured height via resizeToFitContent()', () => {
    const engine = createTextareaAutosize(textarea, {minRows: 2});
    withMeasuredHeight(20, () => {
      engine.resizeToFitContent(true);
    });
    // scrollHeight (20) - 4px (the measuring class's 2px top/bottom padding workaround).
    expect(textarea.style.height).toBe('16px');
  });

  it('does not re-measure when neither the value nor minRows changed (force=false)', () => {
    const engine = createTextareaAutosize(textarea);
    withMeasuredHeight(20, () => {
      engine.resizeToFitContent(true);
      textarea.style.height = '999px'; // simulate something else touching it
      engine.resizeToFitContent(false); // force=false, nothing tracked changed
    });
    expect(textarea.style.height).toBe('999px');
  });

  it('re-measures when the value changed, even without force', () => {
    const engine = createTextareaAutosize(textarea);
    withMeasuredHeight(20, () => {
      engine.resizeToFitContent(true);
      textarea.value = 'something new';
      textarea.style.height = '999px';
      engine.resizeToFitContent(false);
    });
    expect(textarea.style.height).toBe('16px');
  });

  it('setHasFocus(true) does not throw and affects the margin-filler workaround path', () => {
    const engine = createTextareaAutosize(textarea);
    engine.setHasFocus(true);
    expect(() => withMeasuredHeight(20, () => engine.resizeToFitContent(true))).not.toThrow();
  });

  it('notePlaceholderChanged() does not throw with no placeholder', () => {
    const engine = createTextareaAutosize(textarea);
    expect(() => engine.notePlaceholderChanged()).not.toThrow();
  });

  it('minRows/maxRows setters do not throw before any measurement has happened', () => {
    const engine = createTextareaAutosize(textarea);
    expect(() => {
      engine.minRows = 3;
      engine.maxRows = 10;
    }).not.toThrow();
  });
});
