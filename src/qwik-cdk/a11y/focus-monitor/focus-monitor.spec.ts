import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {createPlatform, FocusMonitor, InputModalityDetector} from '../public-api';

describe('FocusMonitor', () => {
  let monitor: FocusMonitor;
  let el: HTMLElement;

  beforeEach(() => {
    const det = new InputModalityDetector();
    monitor = new FocusMonitor(createPlatform(), det);
    el = document.createElement('button');
    document.body.appendChild(el);
  });

  afterEach(() => {
    monitor.stopMonitoring(el);
    monitor.destroy();
    document.body.removeChild(el);
  });

  it('emits null when not focused', () => {
    const sig = monitor.monitor(el);
    expect(sig.value).toBeNull();
  });
  it('emits "program" when focused programmatically', () => {
    const sig = monitor.monitor(el);
    // happy-dom may not fire focus events natively; trigger the handler directly.
    monitor._onFocus(new FocusEvent('focus', {bubbles: true}), el);
    expect(sig.value).toBe('program');
  });
});
