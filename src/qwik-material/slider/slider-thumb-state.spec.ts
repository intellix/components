import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {computeRippleBox} from './slider-ripple';
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

const BOX = computeRippleBox(48, 48);

function nonRangeStore(value = 0): SliderStore {
  return {cachedWidth: 300, cachedLeft: 0, end: createThumbStore(value), rangeTrackSource: 'start'};
}

function rangeStore(start = 30, end = 70): SliderStore {
  return {
    cachedWidth: 300,
    cachedLeft: 0,
    end: createThumbStore(end),
    start: createThumbStore(start),
    rangeTrackSource: 'start',
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
  it('focus shows a focus ripple + indicator', () => {
    const store = nonRangeStore();
    handleThumbFocus(store, 'end', false, BOX);
    expect(store.end.isFocused).toBe(true);
    expect(store.end.focusRipple).toBeDefined();
    expect(thumbWithIndicator(store, 'end', false)).toBe(true);
  });

  it('blur (non-range) removes the focus ripple and the indicator', () => {
    const store = nonRangeStore();
    handleThumbFocus(store, 'end', false, BOX);
    handleThumbBlur(store, 'end', false, BOX);
    expect(store.end.isFocused).toBe(false);
    expect(store.end.focusRipple).toBeUndefined();
    expect(thumbWithIndicator(store, 'end', false)).toBe(false);
  });

  it('blur re-shows the hover ripple if the cursor is still over the thumb', () => {
    const store = nonRangeStore();
    handleThumbPointerMove(store, 'end', true, false, BOX); // hover starts
    handleThumbFocus(store, 'end', false, BOX); // hides hover, shows focus
    expect(store.end.hoverRipple).toBeUndefined();
    handleThumbBlur(store, 'end', false, BOX);
    expect(store.end.hoverRipple).toBeDefined();
  });
});

describe('range value-indicator hand-off (note 6)', () => {
  it('showing a ripple on either thumb also shows the indicator on its sibling', () => {
    const store = rangeStore();
    handleThumbFocus(store, 'start', false, BOX);
    expect(thumbWithIndicator(store, 'start', true)).toBe(true);
    expect(thumbWithIndicator(store, 'end', true)).toBe(true); // sibling, via the derivation
    // But only the focused thumb actually owns a ripple/--focused class.
    expect(store.start.isFocused).toBe(true);
    expect(store.end.isFocused).toBe(false);
  });

  it('moving focus from one range thumb directly to the other keeps both indicators through the hand-off', () => {
    const store = rangeStore();
    handleThumbFocus(store, 'start', false, BOX);
    // Browser dispatches blur on start, then focus on end — blur first.
    handleThumbBlur(store, 'start', false, BOX);
    handleThumbFocus(store, 'end', false, BOX);
    expect(thumbWithIndicator(store, 'start', true)).toBe(true);
    expect(thumbWithIndicator(store, 'end', true)).toBe(true);
    expect(store.start.isFocused).toBe(false);
    expect(store.end.isFocused).toBe(true);
  });
});

describe('rangeTrackSource (note 6 correction — focus ALSO re-renders the track-active branch)', () => {
  it('defaults to start (the mount-settled branch, see SliderStore doc comment)', () => {
    expect(rangeStore().rangeTrackSource).toBe('start');
  });

  it('focusing a thumb updates the source to that thumb, independent of any value change', () => {
    const store = rangeStore();
    handleThumbFocus(store, 'end', false, BOX);
    expect(store.rangeTrackSource).toBe('end');
    handleThumbFocus(store, 'start', false, BOX);
    expect(store.rangeTrackSource).toBe('start');
  });

  it('an input (value change) on a thumb also updates the source to that thumb', () => {
    const store = rangeStore();
    store.rangeTrackSource = 'start';
    handleThumbInput(store, 'end', 71);
    expect(store.rangeTrackSource).toBe('end');
  });

  it('matches the live-measured Angular sequence for the range scenario (focus start, input start, focus end, input end)', () => {
    const store = rangeStore();
    handleThumbFocus(store, 'start', false, BOX);
    expect(store.rangeTrackSource).toBe('start');
    handleThumbInput(store, 'start', 31);
    expect(store.rangeTrackSource).toBe('start');
    handleThumbFocus(store, 'end', false, BOX);
    expect(store.rangeTrackSource).toBe('end');
    handleThumbInput(store, 'end', 69);
    expect(store.rangeTrackSource).toBe('end');
  });
});

describe('handleThumbPointerLeave', () => {
  it('clears hover state and the hover ripple', () => {
    const store = nonRangeStore();
    handleThumbPointerMove(store, 'end', true, false, BOX);
    handleThumbPointerLeave(store, 'end');
    expect(store.end.isHovered).toBe(false);
    expect(store.end.hoverRipple).toBeUndefined();
  });
});

describe('handleThumbInput', () => {
  it('updates the thumb value', () => {
    const store = nonRangeStore(10);
    handleThumbInput(store, 'end', 11);
    expect(store.end.value).toBe(11);
  });
});

describe('handleThumbPointerDown (deferred value correction, note 9)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('marks the thumb active, shows an active ripple, and still calls onSettled (with the unchanged value) even when nothing needed correcting', () => {
    // onSettled is this gesture's SOLE emission point (mat-slider.tsx
    // suppresses the native-input-triggered emission for the whole
    // `correctionPending` window — see that field's doc comment), so it
    // always fires exactly once, regardless of whether a correction
    // actually changed the value.
    const store = nonRangeStore(75);
    const input = {value: '75'} as HTMLInputElement;
    const onSettled = vi.fn();
    handleThumbPointerDown(
      store,
      'end',
      {min: 0, max: 100, step: 1, disabled: false},
      undefined,
      input,
      false,
      BOX,
      {button: 0, clientX: 225}, // 75% of a 300px-wide, 0-cachedLeft slider -> value 75
      onSettled,
    );
    expect(store.end.isActive).toBe(true);
    expect(store.end.activeRipple).toBeDefined();
    expect(store.end.correctionPending).toBe(true);
    vi.runAllTimers();
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledWith(75);
    expect(store.end.correctionPending).toBe(false);
  });

  it('corrects a mismatched value and calls onSettled', () => {
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
      BOX,
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
      BOX,
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
      BOX,
      {button: 0, clientX: 225},
      vi.fn(),
    );
    expect(store.end.isActive).toBe(false);
  });
});

describe('handleThumbPointerUp', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('clears isActive and removes the active ripple (interrupted-enter case, note 5)', () => {
    const store = nonRangeStore();
    handleThumbPointerDown(
      store,
      'end',
      {min: 0, max: 100, step: 1, disabled: false},
      undefined,
      {value: '0'} as HTMLInputElement,
      false,
      BOX,
      {button: 0, clientX: 0},
      () => {},
    );
    handleThumbPointerUp(store, 'end');
    expect(store.end.isActive).toBe(false);
    // A quick click/drag (every scenario here) hides the active ripple
    // before its enter transition would settle — removed promptly, not
    // after the full exit duration. See slider-ripple.ts's `hideRippleKind`
    // doc comment.
    expect(store.end.activeRipple).toBeUndefined();
  });

  it('is a no-op if the thumb was not active', () => {
    const store = nonRangeStore();
    expect(() => handleThumbPointerUp(store, 'end')).not.toThrow();
  });
});
