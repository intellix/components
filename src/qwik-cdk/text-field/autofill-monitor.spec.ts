/**
 * Adapted from `src/cdk/text-field/autofill.spec.ts`'s non-Angular-specific assertions.
 * happy-dom doesn't construct `AnimationEvent`s from real CSS animations (no animation
 * engine), so these tests dispatch a plain `Event('animationstart')` with an
 * `animationName` property attached directly — exactly what the real listener reads,
 * regardless of how the event was produced.
 */
import {describe, expect, it} from 'vitest';
import {createAutofillMonitor} from './autofill-monitor';

function dispatchAnimation(element: Element, animationName: string): void {
  const event = new Event('animationstart') as AnimationEvent & {animationName: string};
  Object.defineProperty(event, 'animationName', {value: animationName});
  element.dispatchEvent(event);
}

describe('createAutofillMonitor', () => {
  it('adds the monitored class when monitoring starts', () => {
    const el = document.createElement('input');
    document.body.appendChild(el);
    const monitor = createAutofillMonitor();

    monitor.monitor(el, () => {});

    expect(el.classList.contains('cdk-text-field-autofill-monitored')).toBe(true);
    monitor.destroy();
    el.remove();
  });

  it('notifies listeners when the autofill-start animation fires', () => {
    const el = document.createElement('input');
    document.body.appendChild(el);
    const monitor = createAutofillMonitor();
    const events: boolean[] = [];

    monitor.monitor(el, event => events.push(event.isAutofilled));
    dispatchAnimation(el, 'cdk-text-field-autofill-start');

    expect(events).toEqual([true]);
    expect(el.classList.contains('cdk-text-field-autofilled')).toBe(true);
    monitor.destroy();
    el.remove();
  });

  it('notifies listeners when the autofill-end animation fires', () => {
    const el = document.createElement('input');
    document.body.appendChild(el);
    const monitor = createAutofillMonitor();
    const events: boolean[] = [];

    monitor.monitor(el, event => events.push(event.isAutofilled));
    dispatchAnimation(el, 'cdk-text-field-autofill-start');
    dispatchAnimation(el, 'cdk-text-field-autofill-end');

    expect(events).toEqual([true, false]);
    expect(el.classList.contains('cdk-text-field-autofilled')).toBe(false);
    monitor.destroy();
    el.remove();
  });

  it('does not notify twice for the same already-applied state (initial-render guard)', () => {
    const el = document.createElement('input');
    document.body.appendChild(el);
    const monitor = createAutofillMonitor();
    const events: boolean[] = [];

    monitor.monitor(el, event => events.push(event.isAutofilled));
    dispatchAnimation(el, 'cdk-text-field-autofill-start');
    dispatchAnimation(el, 'cdk-text-field-autofill-start'); // fires again on e.g. re-render

    expect(events).toEqual([true]);
    monitor.destroy();
    el.remove();
  });

  it('supports multiple listeners on the same element', () => {
    const el = document.createElement('input');
    document.body.appendChild(el);
    const monitor = createAutofillMonitor();
    const a: boolean[] = [];
    const b: boolean[] = [];

    monitor.monitor(el, event => a.push(event.isAutofilled));
    monitor.monitor(el, event => b.push(event.isAutofilled));
    dispatchAnimation(el, 'cdk-text-field-autofill-start');

    expect(a).toEqual([true]);
    expect(b).toEqual([true]);
    monitor.destroy();
    el.remove();
  });

  it('stopMonitoring() removes the monitored/autofilled classes and stops notifying', () => {
    const el = document.createElement('input');
    document.body.appendChild(el);
    const monitor = createAutofillMonitor();
    const events: boolean[] = [];

    monitor.monitor(el, event => events.push(event.isAutofilled));
    dispatchAnimation(el, 'cdk-text-field-autofill-start');
    monitor.stopMonitoring(el);

    expect(el.classList.contains('cdk-text-field-autofill-monitored')).toBe(false);
    expect(el.classList.contains('cdk-text-field-autofilled')).toBe(false);

    dispatchAnimation(el, 'cdk-text-field-autofill-end');
    expect(events).toEqual([true]); // no second notification after stopMonitoring()

    el.remove();
  });

  it("monitor()'s own unsubscribe function only removes that one listener", () => {
    const el = document.createElement('input');
    document.body.appendChild(el);
    const monitor = createAutofillMonitor();
    const a: boolean[] = [];
    const b: boolean[] = [];

    const unsubscribeA = monitor.monitor(el, event => a.push(event.isAutofilled));
    monitor.monitor(el, event => b.push(event.isAutofilled));
    unsubscribeA();
    dispatchAnimation(el, 'cdk-text-field-autofill-start');

    expect(a).toEqual([]);
    expect(b).toEqual([true]);
    monitor.destroy();
    el.remove();
  });

  it('destroy() stops monitoring every element', () => {
    const el1 = document.createElement('input');
    const el2 = document.createElement('input');
    document.body.append(el1, el2);
    const monitor = createAutofillMonitor();

    monitor.monitor(el1, () => {});
    monitor.monitor(el2, () => {});
    monitor.destroy();

    expect(el1.classList.contains('cdk-text-field-autofill-monitored')).toBe(false);
    expect(el2.classList.contains('cdk-text-field-autofill-monitored')).toBe(false);
    el1.remove();
    el2.remove();
  });
});
