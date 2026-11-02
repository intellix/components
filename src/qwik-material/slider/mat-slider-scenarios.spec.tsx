/**
 * MatSlider scenario port from src/material/slider/slider.spec.ts.
 *
 * Upstream has ~150+ `it()` blocks across slider.spec.ts/slider.e2e.spec.ts —
 * heavy on `TestBed`/`ComponentFixture`, synthetic pointer-event dispatch,
 * and `fakeAsync`/`tick()` for the deferred value-correction timing.
 * `createDOM()` hangs this package's vitest worker (see mat-button's own
 * scenario-port comment for the same finding, repeated across every
 * interactive qwik-material component), so no DOM-render tests are
 * attempted here either way. The PURE MATH/STATE-MACHINE layer this port
 * factors slider's logic into (unlike upstream, which has no such
 * separation) IS fully unit-testable without any DOM, and is covered
 * directly:
 *
 *   - slider-math.spec.ts: every geometry/value formula (translateX, fill
 *     percentage, tick marks, track-active style, native-input width,
 *     range min/max clamping, fixValue's click-correction snap), each
 *     cross-checked against the exact numbers angular-parity.spec.ts's
 *     header documents as verified live against upstream.
 *   - slider-ripple.spec.ts: the hover/focus/active ripple-slot state
 *     machine (show/hide, timing, noopAnimations).
 *   - slider-thumb-state.spec.ts: the event-handling layer built on top of
 *     those two (focus/blur/pointer/input handlers, the range value-
 *     indicator hand-off, the controlled-value echo-race guard, the
 *     range track-active source tracking).
 *
 * This file is just the sanity layer on top: the component is exported and
 * callable, and its props shape accepts the full documented surface (both
 * single-thumb and range modes). Real DOM + behavior assertions live in
 * src/qwik-cdk-parity-tests/specs/material-slider/angular-parity.spec.ts
 * (Angular-vs-Qwik DOM diffing — the authoritative parity gate for this
 * component; no Qwik-only Playwright spec was added on top of it — see
 * SYNC.md "no additional Qwik-only spec").
 */
import {describe, it, expect} from 'vitest';
import {$} from '@qwik.dev/core';
import {MatSlider, type MatSliderColor, type MatSliderProps} from './public-api';

describe('MatSlider surface — sanity', () => {
  it('MatSlider is exported and function-shaped', () => {
    expect(typeof MatSlider).toBe('function');
  });

  it('MatSliderColor accepts every documented value', () => {
    const colors: MatSliderColor[] = ['primary', 'accent', 'warn'];
    expect(colors).toHaveLength(3);
  });

  it('MatSliderProps accepts the single-thumb surface', () => {
    const props: MatSliderProps = {
      min: 0,
      max: 100,
      step: 1,
      discrete: true,
      showTickMarks: true,
      disabled: false,
      disableRipple: false,
      color: 'accent',
      displayWith: $((v: number) => `${v}`),
      class: 'extra',
      style: 'width: 300px',
      value: 50,
      onValueChange$: $((_v: number) => {}),
    };
    expect(props.value).toBe(50);
  });

  it('MatSliderProps accepts the range surface', () => {
    const props: MatSliderProps = {
      startValue: 30,
      endValue: 70,
      onStartValueChange$: $((_v: number) => {}),
      onEndValueChange$: $((_v: number) => {}),
    };
    expect(props.startValue).toBe(30);
    expect(props.endValue).toBe(70);
  });

  it('a no-op onValueChange$ does not throw when invoked', async () => {
    const noop = $((_v: number) => {});
    await expect(noop(1)).resolves.toBeUndefined();
  });
});
