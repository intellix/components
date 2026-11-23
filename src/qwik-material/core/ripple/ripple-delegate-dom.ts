import {getRippleRenderer} from './ripple-registry';
import {handleRippleEvent, rippleAnimationConfig} from './ripple-dom';
import type {RippleTarget} from './ripple-renderer';
import type {RippleGlobalOptions} from './ripple-global-options';

/**
 * The client half of the ripple delegate (`useMatRippleDelegate()`, ripple-delegate.ts): ONE set of
 * document listeners launching every ripple on the page — upstream's `RippleEventManager` and
 * `MatRippleLoader` (`src/material/core/ripple/ripple-event-manager.ts`,
 * `src/material/core/private/ripple-loader.ts`), each of which is a single document-level listener
 * per event type. Before, every ripple host carried its own six to eight `q-e:*` handler
 * attributes (and the state they capture) in the server-rendered HTML.
 *
 * A pointer press walks from the event's target up through every ancestor — as qwikloader
 * dispatched the per-host handlers before, so a ripple host inside another (a button in a list
 * item) ripples both — and launches a ripple for each RIPPLE TRIGGER it meets:
 *
 * - A button-family loader host (`[mat-ripple-loader-class-name="mat-mdc-button-ripple"]`, the
 *   attributes upstream's `MatRippleLoader` reads): container its `.mat-ripple` child, config read
 *   off its `mat-ripple-loader-disabled`/`-centered` attributes, exactly as `_createRipple` builds
 *   its `RippleTarget`. Chips have their own loader and are not delegated.
 * - An interactive list item (`.mat-mdc-list-item-interactive`): container itself, disabled by
 *   `.mdc-list-item--disabled` (and animations disabled — `MatListItemBase.disableRipple`).
 * - A CLAIMED element (`useRippleClaim()`, ripple-delegate.ts): one whose ripple config isn't in
 *   its DOM — a `useMatRipple()` host, a list item with `disableRipple`, any host under a nested
 *   `useMatRippleProvider()`/`useMatAnimationsProvider()`. Its one `pointerdown` handler marks it
 *   synchronously ({@link CLAIM}: a veto, or "configured") and, for a configured claim, hands its
 *   config to {@link registerRippleClaim} — `pointerdown` precedes the `mousedown`/`touchstart`
 *   that launches, so the claim is always in place first. A configured claim whose config hasn't
 *   arrived yet (its handler's chunk still loading) queues the press until it does.
 *
 * Releases: a launched trigger gets native `mouseup`/`touchend`/`touchcancel` (capture: from any
 * descendant) and `mouseleave` (its own) listeners — upstream's `RippleRenderer` registers the same
 * on its trigger. A launch that runs only after its press already ended (the first press of a
 * page, while this module's chunk loads) would miss those, so the delegate's synchronous
 * handlers record the last release ({@link RELEASE}) and when the pointer last left each element
 * ({@link LEFT_AT}); a late launch that finds either after its own event fades out at once.
 */

/**
 * Expando names shared with the delegate's `sync$` handlers in ripple-delegate.ts, which run
 * synchronously during the event's dispatch, serialized, and so can't import these.
 */
/** On a trigger: `[the pointerdown event that claimed it, 0 (veto) | 1 (configured)]`. */
export const CLAIM = '__matRippleClaim';
/** On the window: the last `pointerdown` event. */
export const POINTER_DOWN = '__matRipplePointerDown';
/** On the window: the sequence number of the last `mouseup`/`touchend`/`touchcancel`. */
export const RELEASE = '__matRippleRelease';
/** On an element: the sequence number of the last `mouseout` that left it. */
export const LEFT_AT = '__matRippleLeftAt';
/** On a press event: its sequence number (and on the window, the last one given). */
export const SEQ = '__matRippleSeq';
/** On an event: the loader hosts it initialized (that press itself launches no ripple). */
export const BOOT = '__matRippleBoot';

/** The loader attributes (upstream `MatRippleLoader`'s). */
export const LOADER_CLASS_NAME_ATTR = 'mat-ripple-loader-class-name';
export const LOADER_CENTERED_ATTR = 'mat-ripple-loader-centered';
export const LOADER_DISABLED_ATTR = 'mat-ripple-loader-disabled';
export const LOADER_UNINITIALIZED_ATTR = 'mat-ripple-loader-uninitialized';
/** The one loader class name the delegate handles: the button family's. */
export const DELEGATED_LOADER_CLASS_NAME = 'mat-mdc-button-ripple';

/** What a configured claim launches with. `container` defaults to its kind's (see above). */
export interface RippleClaimConfig {
  container?: Element;
  target: RippleTarget;
  globalOptions?: RippleGlobalOptions;
}

type Press = MouseEvent | TouchEvent;
type Expandos = Record<string, unknown>;

const expando = <T>(o: object | null | undefined, key: string): T | undefined =>
  o ? ((o as Expandos)[key] as T | undefined) : undefined;

/** Each configured trigger's latest config, with the pointerdown that registered it. */
const configs = new WeakMap<Element, {claim: Event; config: RippleClaimConfig}>();
/** Presses on a configured trigger waiting for its config, with the delegate's scope then. */
const pending = new WeakMap<Element, {event: Press; scope: DelegateScope}[]>();
/** The containers launched from each trigger, for its release listeners. */
const containers = new WeakMap<Element, Set<Element>>();

/** What the delegate itself provides: its scope's `MAT_RIPPLE_GLOBAL_OPTIONS`, animations. */
export interface DelegateScope {
  globalOptions: RippleGlobalOptions;
  animationsDisabled: boolean;
}

const isLoaderHost = (el: Element): boolean =>
  el.getAttribute(LOADER_CLASS_NAME_ATTR) === DELEGATED_LOADER_CLASS_NAME;

const isInteractiveListItem = (el: Element): boolean =>
  el.classList.contains('mat-mdc-list-item-interactive');

/** A trigger's config when nothing claimed it, by its kind; `undefined`: not a trigger. */
function domConfig(el: Element, scope: DelegateScope): RippleClaimConfig | undefined {
  const animation = rippleAnimationConfig(scope.animationsDisabled);
  if (isLoaderHost(el)) {
    return {
      target: {
        rippleDisabled: el.hasAttribute(LOADER_DISABLED_ATTR),
        rippleConfig: {centered: el.hasAttribute(LOADER_CENTERED_ATTR), animation},
      },
      globalOptions: scope.globalOptions,
    };
  }
  if (isInteractiveListItem(el)) {
    return {
      target: {
        // `MatListItemBase.disableRipple`: `disabled || _noopAnimations || …` (the rest, the
        // item's and the list's own `disableRipple`, are claims).
        rippleDisabled:
          el.classList.contains('mdc-list-item--disabled') || scope.animationsDisabled,
        rippleConfig: {animation},
      },
      globalOptions: scope.globalOptions,
    };
  }
  return undefined;
}

/** The claim `el` made for this press, or `undefined` (none, or one from an earlier press). */
function claimOf(el: Element, pointerDown: unknown): 0 | 1 | undefined {
  const claim = expando<[Event, 0 | 1]>(el, CLAIM);
  return claim && pointerDown && claim[0] === pointerDown ? claim[1] : undefined;
}

/**
 * Whether `event`'s press ended before now — released, or `trigger` left, since: the delegate's
 * synchronous handlers number presses ({@link SEQ}), releases and leaves in one sequence.
 */
function pressEnded(trigger: Element, event: Press): boolean {
  const seq = expando<number>(event, SEQ) ?? Infinity;
  const release = expando<number>(trigger.ownerDocument.defaultView, RELEASE) ?? -1;
  const leftAt = expando<number>(trigger, LEFT_AT) ?? -1;
  return release > seq || leftAt > seq;
}

function onRelease(event: Event): void {
  for (const container of containers.get(event.currentTarget as Element) ?? []) {
    getRippleRenderer(container).handlePointerUp();
  }
}

/** Launches `event`'s ripple from `trigger` with `config`, and listens for its release. */
function launch(trigger: Element, event: Press, config: RippleClaimConfig): void {
  const loader = isLoaderHost(trigger);
  // The press that created a loader host's ripple launches none (upstream: its listener is
  // added during that very dispatch); hosts it initialized are on the event.
  if (loader && expando<Element[]>(event, BOOT)?.includes(trigger)) return;
  const container = config.container ?? (loader ? trigger.querySelector('.mat-ripple') : trigger);
  if (!container) return;
  handleRippleEvent(event, container, config.target, config.globalOptions);
  let launched = containers.get(trigger);
  if (!launched) {
    containers.set(trigger, (launched = new Set()));
    for (const type of ['mouseup', 'touchend', 'touchcancel']) {
      trigger.addEventListener(type, onRelease, {capture: true, passive: true});
    }
    trigger.addEventListener('mouseleave', onRelease, {passive: true});
  }
  launched.add(container);
  if (pressEnded(trigger, event)) getRippleRenderer(container).handlePointerUp();
}

/**
 * The delegate's `mousedown`/`touchstart` handler: a ripple for every trigger from the event's
 * target up (see the module doc comment), with `scope`'s options for the unclaimed ones.
 */
export function launchDelegatedRipples(event: Press, scope: DelegateScope): void {
  const target = event.target as Node | null;
  const view = target?.ownerDocument?.defaultView;
  const pointerDown = expando<Event>(view, POINTER_DOWN);
  for (
    let el: Element | null =
      target?.nodeType === 1 ? (target as Element) : (target?.parentElement ?? null);
    el;
    el = el.parentElement
  ) {
    const claim = claimOf(el, pointerDown);
    if (claim === 0) continue;
    if (claim === 1) {
      const registered = configs.get(el);
      if (registered && registered.claim === pointerDown) {
        launch(el, event, withScope(registered.config, scope));
      } else {
        const queue = pending.get(el) ?? [];
        queue.push({event, scope});
        pending.set(el, queue);
      }
      continue;
    }
    const config = domConfig(el, scope);
    if (config) launch(el, event, config);
  }
}

/** A claim's config, the delegate's global options when it brought none. */
function withScope(config: RippleClaimConfig, scope: DelegateScope): RippleClaimConfig {
  return config.globalOptions ? config : {...config, globalOptions: scope.globalOptions};
}

/**
 * A configured claim's config for the press `claim` (its `pointerdown`) started — called by the
 * claim's own handler (`useRippleClaim()`), with the config its component's closure holds.
 * Launches the presses that waited for it.
 */
export function registerRippleClaim(
  trigger: Element,
  claim: Event,
  config: RippleClaimConfig,
): void {
  configs.set(trigger, {claim, config});
  const queue = pending.get(trigger);
  if (!queue) return;
  pending.delete(trigger);
  for (const {event, scope} of queue) launch(trigger, event, withScope(config, scope));
}
