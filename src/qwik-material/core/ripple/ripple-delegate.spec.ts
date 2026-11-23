import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {
  initializeLoaderRipple,
  recordLeave,
  recordPointerDown,
  recordRelease,
  claimRipple,
  vetoRipple,
} from './ripple-delegate';
import {
  launchDelegatedRipples,
  registerRippleClaim,
  type DelegateScope,
} from './ripple-delegate-dom';

/**
 * The ripple delegate (`useMatRippleDelegate()`): its synchronous `sync$` handlers and the launcher
 * they hand presses to, driven as qwikloader drives them — each document-level handler called
 * with the event, a claim's element handler with the event and its element. happy-dom has no
 * layout, so a launched ripple is asserted by its `.mat-ripple-element` (see
 * ripple-renderer.spec.ts for the animation itself).
 */

type Handler = (event: Event, el?: Element) => void;
/** A `sync$`'s function (the optimizer keeps it on the QRL as `resolved`). */
const fn = (qrl: unknown): Handler => {
  const resolved = (qrl as {resolved?: Handler}).resolved;
  if (typeof resolved !== 'function') throw new Error('sync$ not resolved');
  return resolved;
};

const scope: DelegateScope = {globalOptions: {}, animationsDisabled: false};

let root: HTMLElement;
beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  delete (window as unknown as Record<string, unknown>)['__matRipplePointerDown'];
  delete (window as unknown as Record<string, unknown>)['__matRippleRelease'];
  delete (window as unknown as Record<string, unknown>)['__matRippleSeq'];
});
afterEach(() => root.remove());

/** A button-family loader host, as `MatButton` renders it before any interaction. */
function loaderHost(attrs: Record<string, string> = {}): HTMLElement {
  const host = document.createElement('button');
  host.setAttribute('mat-ripple-loader-class-name', 'mat-mdc-button-ripple');
  host.setAttribute('mat-ripple-loader-uninitialized', '');
  for (const [k, v] of Object.entries(attrs)) host.setAttribute(k, v);
  host.innerHTML = '<span class="mdc-button__label">Label</span>';
  root.append(host);
  return host;
}

function listItem(classes = ''): HTMLElement {
  const item = document.createElement('a');
  item.className = `mat-mdc-list-item mdc-list-item mat-mdc-list-item-interactive ${classes}`;
  item.innerHTML = '<span class="mdc-list-item__content">Item</span>';
  root.append(item);
  return item;
}

const event = <T extends Event>(target: Element, e: T): T => {
  target.dispatchEvent(e);
  return e;
};
const mouse = (type: string, target: Element, init: MouseEventInit = {}) =>
  event(
    target,
    new MouseEvent(type, {bubbles: true, clientX: 5, clientY: 5, buttons: 1, detail: 1, ...init}),
  );

/** A press as the browser sends it: pointerdown (claims), then mousedown (launch). */
function press(target: Element, claims: [Element, 'veto' | 'claim'][] = []): MouseEvent {
  const down = event(target, new PointerEvent('pointerdown', {bubbles: true}));
  fn(recordPointerDown)(down);
  for (const [el, kind] of claims) fn(kind === 'veto' ? vetoRipple : claimRipple)(down, el);
  const md = mouse('mousedown', target);
  fn(initializeLoaderRipple)(md);
  return md;
}

const ripples = (container: Element) => container.querySelectorAll(':scope > .mat-ripple-element');

describe('ripple delegate: loader hosts', () => {
  it('creates the ripple element on hover, as upstream _createRipple, once', () => {
    const host = loaderHost();
    const label = host.querySelector('span')!;
    fn(initializeLoaderRipple)(mouse('mouseover', label));
    fn(initializeLoaderRipple)(mouse('mouseover', host));

    expect(host.hasAttribute('mat-ripple-loader-uninitialized')).toBe(false);
    expect(host.querySelectorAll('.mat-ripple')).toHaveLength(1);
    expect(host.lastElementChild?.outerHTML).toBe(
      '<span class="mat-ripple mat-mdc-button-ripple"></span>',
    );
  });

  it("initializes on the host's own focus only", () => {
    const host = loaderHost();
    const inner = document.createElement('input');
    host.append(inner);
    fn(initializeLoaderRipple)(event(inner, new FocusEvent('focusin', {bubbles: true})));
    expect(host.hasAttribute('mat-ripple-loader-uninitialized')).toBe(true);
    fn(initializeLoaderRipple)(event(host, new FocusEvent('focusin', {bubbles: true})));
    expect(host.hasAttribute('mat-ripple-loader-uninitialized')).toBe(false);
  });

  it('leaves other loaders (chips) to their own', () => {
    const chip = loaderHost({'mat-ripple-loader-class-name': 'mat-mdc-chip-ripple'});
    fn(initializeLoaderRipple)(mouse('mouseover', chip));
    expect(chip.hasAttribute('mat-ripple-loader-uninitialized')).toBe(true);
    expect(chip.querySelector('.mat-ripple')).toBeNull();
  });

  it('the press that creates the ripple element launches none; the next one does', () => {
    const host = loaderHost();
    launchDelegatedRipples(press(host), scope);
    const container = host.querySelector('.mat-ripple')!;
    expect(ripples(container)).toHaveLength(0);

    launchDelegatedRipples(press(host), scope);
    expect(ripples(container)).toHaveLength(1);
  });

  it('reads disabled and centered off the host attributes', () => {
    const disabled = loaderHost({'mat-ripple-loader-disabled': ''});
    fn(initializeLoaderRipple)(mouse('mouseover', disabled));
    launchDelegatedRipples(press(disabled), scope);
    expect(ripples(disabled.querySelector('.mat-ripple')!)).toHaveLength(0);
  });
});

describe('ripple delegate: list items and nesting', () => {
  it('launches into an interactive list item itself, not a disabled one', () => {
    const item = listItem();
    launchDelegatedRipples(press(item.firstElementChild!), scope);
    expect(ripples(item)).toHaveLength(1);

    const disabled = listItem('mdc-list-item--disabled');
    launchDelegatedRipples(press(disabled), scope);
    expect(ripples(disabled)).toHaveLength(0);
  });

  it('animations disabled disable a list item ripple (MatListItemBase.disableRipple)', () => {
    const item = listItem();
    launchDelegatedRipples(press(item), {...scope, animationsDisabled: true});
    expect(ripples(item)).toHaveLength(0);
  });

  it('a button in a list item ripples both, as the per-host handlers did', () => {
    const item = listItem();
    const host = loaderHost();
    item.append(host);
    fn(initializeLoaderRipple)(mouse('mouseover', host));
    launchDelegatedRipples(press(host), scope);
    expect(ripples(host.querySelector('.mat-ripple')!)).toHaveLength(1);
    expect(ripples(item)).toHaveLength(1);
  });

  it('a non-trigger element ripples nothing', () => {
    const div = document.createElement('div');
    root.append(div);
    launchDelegatedRipples(press(div), scope);
    expect(root.querySelectorAll('.mat-ripple-element')).toHaveLength(0);
  });
});

describe('ripple delegate: claims', () => {
  it('a veto from this press stops the ripple; one from an earlier press does not', () => {
    const item = listItem();
    launchDelegatedRipples(press(item, [[item, 'veto']]), scope);
    expect(ripples(item)).toHaveLength(0);

    // The next press without the claim (the host re-rendered without `disableRipple`).
    launchDelegatedRipples(press(item), scope);
    expect(ripples(item)).toHaveLength(1);
  });

  it('a configured claim launches with its own container and config', () => {
    const trigger = document.createElement('div');
    const container = document.createElement('div');
    root.append(trigger, container);
    const md = press(trigger, [[trigger, 'claim']]);
    const down = (window as unknown as Record<string, Event>)['__matRipplePointerDown'];
    registerRippleClaim(trigger, down, {
      container,
      target: {rippleDisabled: false, rippleConfig: {}},
      globalOptions: {},
    });
    launchDelegatedRipples(md, scope);
    expect(ripples(container)).toHaveLength(1);
    expect(ripples(trigger)).toHaveLength(0);
  });

  it('a press waits for a claim whose config is still loading', () => {
    const trigger = document.createElement('div');
    root.append(trigger);
    const md = press(trigger, [[trigger, 'claim']]);
    const down = (window as unknown as Record<string, Event>)['__matRipplePointerDown'];
    launchDelegatedRipples(md, scope);
    expect(ripples(trigger)).toHaveLength(0);

    registerRippleClaim(trigger, down, {target: {rippleDisabled: false, rippleConfig: {}}});
    expect(ripples(trigger)).toHaveLength(1);
  });
});

describe('ripple delegate: release', () => {
  /** The ripple elements not faded out (removed, or fading out: `opacity: 0`). */
  const visible = (container: Element) =>
    Array.from(ripples(container)).filter(r => (r as HTMLElement).style.opacity !== '0');

  it('mouseup on the trigger fades its ripple out', () => {
    const item = listItem();
    launchDelegatedRipples(press(item), scope);
    expect(visible(item)).toHaveLength(1);
    mouse('mouseup', item.firstElementChild!);
    expect(visible(item)).toHaveLength(0);
  });

  it('leaving the trigger fades its ripple out', () => {
    const item = listItem();
    launchDelegatedRipples(press(item), scope);
    item.dispatchEvent(new MouseEvent('mouseleave'));
    expect(visible(item)).toHaveLength(0);
  });

  it('a launch that runs after its press was released fades out at once', () => {
    const item = listItem();
    const md = press(item);
    fn(recordRelease)(mouse('mouseup', item, {}));
    launchDelegatedRipples(md, scope);
    expect(visible(item)).toHaveLength(0);
  });

  it('a launch that runs after the pointer left the trigger fades out at once', () => {
    const item = listItem();
    const md = press(item);
    fn(recordLeave)(mouse('mouseout', item, {relatedTarget: document.body}));
    launchDelegatedRipples(md, scope);
    expect(visible(item)).toHaveLength(0);
  });
});
