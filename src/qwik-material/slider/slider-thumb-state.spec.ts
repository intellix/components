import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
  createThumbStore,
  handleThumbBlur,
  handleThumbFocus,
  handleThumbInput,
  handleThumbPointerDown,
  handleThumbPointerLeave,
  handleThumbPointerMove,
  handleThumbPointerUp,
  isCursorOnSliderThumb,
  siblingOf,
  thumbOf,
  thumbWithIndicator,
  type SliderStore,
} from './slider-thumb-state';

function nonRangeStore(value = 0): SliderStore {
  return {cachedWidth: 300, cachedLeft: 0, hasAnimation: false, end: createThumbStore(value)};
}

function rangeStore(start = 30, end = 70): SliderStore {
  return {
    cachedWidth: 300,
    cachedLeft: 0,
    hasAnimation: false,
    end: createThumbStore(end),
    start: createThumbStore(start),
  };
}

describe('thumbOf / siblingOf', () => {
  it('non-range: a thumb is its own sibling', () => {
    const store = nonRangeStore();
    expect(siblingOf(store, 'end')).toBe(thumbOf(store, 'end'));
  });

  it('range: siblings are the other thumb', () => {
    const store = rangeStore();
    expect(siblingOf(store, 'start')).toBe(store.end);
    expect(siblingOf(store, 'end')).toBe(store.start);
  });
});

describe('isCursorOnSliderThumb', () => {
  const rect = {x: 100, y: 100, width: 48, height: 48}; // center (124, 124), radius 24

  it('true at the exact center', () => {
    expect(isCursorOnSliderThumb(124, 124, rect)).toBe(true);
  });

  it('false just outside the radius', () => {
    expect(isCursorOnSliderThumb(124 + 25, 124, rect)).toBe(false);
  });

  it('true just inside the radius', () => {
    expect(isCursorOnSliderThumb(124 + 20, 124, rect)).toBe(true);
  });
});

describe('handleThumbFocus / handleThumbBlur (note 5 / note 7)', () => {
  it('focus shows a focus ripple + indicator, resets hasAnimation', () => {
    const store = nonRangeStore();
    store.hasAnimation = true;
    handleThumbFocus(store, 'end', false);
    expect(store.end.isFocused).toBe(true);
    expect(store.end.focusRipple).toBeDefined();
    expect(thumbWithIndicator(store, 'end', false)).toBe(true);
    expect(store.hasAnimation).toBe(false);
  });

  it('blur (non-range) removes the focus ripple and the indicator', () => {
    const store = nonRangeStore();
    handleThumbFocus(store, 'end', false);
    handleThumbBlur(store, 'end', false);
    expect(store.end.isFocused).toBe(false);
    expect(store.end.focusRipple).toBeUndefined();
    expect(thumbWithIndicator(store, 'end', false)).toBe(false);
  });

  it('blur re-shows the hover ripple if the cursor is still over the thumb', () => {
    const store = nonRangeStore();
    handleThumbPointerMove(store, 'end', true, false); // hover starts
    handleThumbFocus(store, 'end', false); // hides hover, shows focus
    expect(store.end.hoverRipple).toBeUndefined();
    handleThumbBlur(store, 'end', false);
    expect(store.end.hoverRipple).toBeDefined();
  });
});

describe('range value-indicator hand-off (note 6)', () => {
  it('showing a ripple on either thumb also shows the indicator on its sibling', () => {
    const store = rangeStore();
    handleThumbFocus(store, 'start', false);
    expect(thumbWithIndicator(store, 'start', true)).toBe(true);
    expect(thumbWithIndicator(store, 'end', true)).toBe(true); // sibling, via the derivation
    // But only the focused thumb actually owns a ripple/--focused class.
    expect(store.start.isFocused).toBe(true);
    expect(store.end.isFocused).toBe(false);
  });

  it('moving focus from one range thumb directly to the other keeps both indicators through the hand-off', () => {
    const store = rangeStore();
    handleThumbFocus(store, 'start', false);
    // Browser dispatches blur on start, then focus on end — blur first.
    handleThumbBlur(store, 'start', false);
    handleThumbFocus(store, 'end', false);
    expect(thumbWithIndicator(store, 'start', true)).toBe(true);
    expect(thumbWithIndicator(store, 'end', true)).toBe(true);
    expect(store.start.isFocused).toBe(false);
    expect(store.end.isFocused).toBe(true);
  });
});

describe('handleThumbPointerLeave', () => {
  it('clears hover state and the hover ripple', () => {
    const store = nonRangeStore();
    handleThumbPointerMove(store, 'end', true, false);
    handleThumbPointerLeave(store, 'end');
    expect(store.end.isHovered).toBe(false);
    expect(store.end.hoverRipple).toBeUndefined();
  });
});

describe('handleThumbInput', () => {
  it('updates value and sets hasAnimation when a step is defined', () => {
    const store = nonRangeStore(10);
    handleThumbInput(store, 'end', 11, true);
    expect(store.end.value).toBe(11);
    expect(store.hasAnimation).toBe(true);
  });
});

describe('handleThumbPointerDown (deferred value correction, note 9)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('marks the thumb active, shows an active ripple, and leaves an unchanged value alone', () => {
    const store = nonRangeStore(75);
    const input = {value: '75'} as HTMLInputElement;
    const onCorrected = vi.fn();
    handleThumbPointerDown(
      store,
      'end',
      {min: 0, max: 100, step: 1, disabled: false},
      undefined,
      input,
      false,
      {button: 0, clientX: 225}, // 75% of a 300px-wide, 0-cachedLeft slider -> value 75
      onCorrected,
    );
    expect(store.end.isActive).toBe(true);
    expect(store.end.activeRipple).toBeDefined();
    vi.runAllTimers();
    expect(onCorrected).not.toHaveBeenCalled();
    expect(store.hasAnimation).toBe(false);
  });

  it('corrects a mismatched value and calls onCorrected', () => {
    const store = nonRangeStore(10);
    const input = {value: '10'} as HTMLInputElement;
    const onCorrected = vi.fn();
    handleThumbPointerDown(
      store,
      'end',
      {min: 0, max: 100, step: 1, disabled: false},
      undefined,
      input,
      false,
      {button: 0, clientX: 225},
      onCorrected,
    );
    vi.runAllTimers();
    expect(onCorrected).toHaveBeenCalledWith(75);
    expect(store.end.value).toBe(75);
    expect(input.value).toBe('75');
  });

  it('a non-primary button press is a no-op', () => {
    const store = nonRangeStore(10);
    handleThumbPointerDown(
      store,
      'end',
      {min: 0, max: 100, step: 1, disabled: false},
      undefined,
      {value: '10'} as HTMLInputElement,
      false,
      {button: 2, clientX: 225},
      vi.fn(),
    );
    expect(store.end.isActive).toBe(false);
  });

  it('a disabled thumb never activates (defensive — real disabled inputs never dispatch the event)', () => {
    const store = nonRangeStore(10);
    handleThumbPointerDown(
      store,
      'end',
      {min: 0, max: 100, step: 1, disabled: true},
      undefined,
      {value: '10'} as HTMLInputElement,
      false,
      {button: 0, clientX: 225},
      vi.fn(),
    );
    expect(store.end.isActive).toBe(false);
  });
});

describe('handleThumbPointerUp', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('clears isActive and starts fading the active ripple (400ms exit, note 5)', () => {
    const store = nonRangeStore();
    handleThumbPointerDown(
      store,
      'end',
      {min: 0, max: 100, step: 1, disabled: false},
      undefined,
      {value: '0'} as HTMLInputElement,
      false,
      {button: 0, clientX: 0},
      () => {},
    );
    handleThumbPointerUp(store, 'end');
    expect(store.end.isActive).toBe(false);
    // Still present but exiting — real removal happens ~400ms later (see
    // slider-ripple.spec.ts for the timing itself; this test only checks
    // the hand-off from handleThumbPointerDown/Up).
    expect(store.end.activeRipple?.exiting).toBe(true);
    vi.runAllTimers();
    expect(store.end.activeRipple).toBeUndefined();
  });

  it('is a no-op if the thumb was not active', () => {
    const store = nonRangeStore();
    expect(() => handleThumbPointerUp(store, 'end')).not.toThrow();
  });
});
