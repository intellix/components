import {describe, it, expect} from 'vitest';
import {createOverlayRef} from './public-api';

describe('OverlayRef', () => {
  it('updateSize sets px on width/height', () => {
    const entry: any = {
      id: 'x',
      state: {
        panelClasses: {value: []},
        backdropShowing: {value: false},
        detached: {value: false},
        width: {value: undefined},
        height: {value: undefined},
        minWidth: {value: undefined},
        minHeight: {value: undefined},
        maxWidth: {value: undefined},
        maxHeight: {value: undefined},
      },
    };
    const ref = createOverlayRef({registry: {remove() {}} as any, entry});
    ref.updateSize({width: 100, height: '50vh'});
    expect(entry.state.width.value).toBe('100px');
    expect(entry.state.height.value).toBe('50vh');
  });

  it('updateProps shallow-merges onto entry.props and reassigns it (new reference)', () => {
    const entry: any = {
      id: 'x',
      props: {a: 1, b: 2},
      state: {
        panelClasses: {value: []},
        backdropShowing: {value: false},
        detached: {value: false},
        width: {value: undefined},
        height: {value: undefined},
        minWidth: {value: undefined},
        minHeight: {value: undefined},
        maxWidth: {value: undefined},
        maxHeight: {value: undefined},
      },
    };
    const originalProps = entry.props;
    const ref = createOverlayRef({registry: {remove() {}} as any, entry});
    ref.updateProps({b: 20, c: 3});
    expect(entry.props).toEqual({a: 1, b: 20, c: 3});
    expect(entry.props).not.toBe(originalProps);
  });

  it('updateProps calls visuals.setProps with the merged props once attached', () => {
    const entry: any = {
      id: 'x',
      props: {a: 1},
      config: {},
      state: {
        panelClasses: {value: []},
        backdropShowing: {value: false},
        detached: {value: false},
        width: {value: undefined},
        height: {value: undefined},
        minWidth: {value: undefined},
        minHeight: {value: undefined},
        maxWidth: {value: undefined},
        maxHeight: {value: undefined},
      },
    };
    const setPropsCalls: Record<string, unknown>[] = [];
    const ref = createOverlayRef({registry: {remove() {}} as any, entry});
    ref._onAttached(document.createElement('div'), document.createElement('div'), {
      setBackdropShowing() {},
      setBackdropDetached() {},
      setPanelClasses() {},
      setDetached() {},
      setProps: v => setPropsCalls.push(v),
    });
    ref.updateProps({a: 2});
    expect(setPropsCalls).toEqual([{a: 2}]);
  });

  function makeBareEntry(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'x',
      props: {},
      config: {},
      state: {
        panelClasses: {value: []},
        backdropShowing: {value: false},
        backdropDetached: {value: false},
        detached: {value: false},
        width: {value: undefined},
        height: {value: undefined},
        minWidth: {value: undefined},
        minHeight: {value: undefined},
        maxWidth: {value: undefined},
        maxHeight: {value: undefined},
      },
      ...overrides,
    } as any;
  }

  it('detachments() calls every registered callback exactly once, when detach() runs', () => {
    const entry = makeBareEntry();
    const ref = createOverlayRef({registry: {remove() {}} as any, entry});
    const calls: string[] = [];
    const unsubscribe = ref.detachments(() => calls.push('a'));
    ref.detachments(() => calls.push('b'));

    unsubscribe(); // 'a' should no longer fire
    ref.detach();
    expect(calls).toEqual(['b']);

    // A second detach() must not fire 'b' again.
    ref.detach();
    expect(calls).toEqual(['b']);
  });

  it('backdropClick() fires on _notifyBackdropClick regardless of any other close behavior', () => {
    const entry = makeBareEntry();
    const ref = createOverlayRef({registry: {remove() {}} as any, entry});
    const events: MouseEvent[] = [];
    ref.backdropClick(e => events.push(e));

    const fakeEvent = {type: 'click'} as MouseEvent;
    ref._notifyBackdropClick(fakeEvent);
    expect(events).toEqual([fakeEvent]);

    // Unsubscribe stops further notifications.
    const unsubscribe = ref.backdropClick(() => {});
    unsubscribe();
    ref._notifyBackdropClick(fakeEvent);
    expect(events).toEqual([fakeEvent, fakeEvent]);
  });

  it('keydownEvents() installs a fan-out on _keydownEvents that the keyboard dispatcher already reads', () => {
    const entry = makeBareEntry();
    const ref = createOverlayRef({registry: {remove() {}} as any, entry});
    const events: KeyboardEvent[] = [];
    ref.keydownEvents(e => events.push(e));
    ref.keydownEvents(e => events.push(e));

    expect(ref._keydownEvents).toBeTypeOf('function');
    const fakeEvent = {key: 'Escape'} as KeyboardEvent;
    ref._keydownEvents!(fakeEvent);
    expect(events).toEqual([fakeEvent, fakeEvent]);
  });
});
