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
 * - A CLAIMED element (`rippleClaimProps()`, ripple-delegate.ts): one whose ripple config isn't in
 *   its DOM. Its one `pointerdown` handler marks it synchronously, for this press: a VETO of its
 *   own kind's ripple above (a list item's own or list's `disableRipple`); a DOM CLAIM, replacing
 *   that kind's config with the one it registers (any host below a `useMatRippleProvider()`/
 *   `useMatAnimationsProvider()` nested under the delegate); or an OWN CLAIM, an additional ripple
 *   with its own container and config (`useMatRipple()` — on a plain element, or composed onto a
 *   button with `mergeHostProps()`, which then ripples twice, as upstream's two directives do).
 *   `pointerdown` precedes the `mousedown`/`touchstart` that launches, so the claim is in place
 *   first; a claim whose config hasn't arrived yet (its handler's chunk still loading) queues the
 *   press until it does. A press with no `pointerdown` of its own on the element (a synthetic
 *   `mousedown`, a screen reader's) goes by the element's last claims.
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
/** On a trigger: the `pointerdown` that made it an own claim (an additional ripple). */
export const CLAIM = '__matRippleClaim';
/** On a trigger: the `pointerdown` that made it a DOM claim (its kind's ripple, its config). */
export const DOM_CLAIM = '__matRippleDomClaim';
/** On a trigger: the `pointerdown` that vetoed its kind's ripple. */
export const VETO = '__matRippleVeto';
/**
 * On the window: the last `pointerdown`; on a press event, the one in force when it was dispatched
 * (copied synchronously — the launch may run after a later press); on a `pointerdown`, its target
 * ({@link POINTER_TARGET}).
 */
export const POINTER_DOWN = '__matRipplePointerDown';
/** On a `pointerdown`: its innermost target (`composedPath()[0]`, through shadow roots). */
export const POINTER_TARGET = '__matRippleTarget';
/** On a press event: launched already (by another delegate on the page). */
export const HANDLED = '__matRippleHandled';
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

/** What a claim is: an additional ripple (`own`) or its element's kind's (`dom`). */
export type ClaimKind = 'own' | 'dom';

/** Each claimed trigger's latest config per kind, with the pointerdown that registered it. */
const configs = new WeakMap<Element, Map<ClaimKind, {claim: Event; config: RippleClaimConfig}>>();
/** Presses on a claimed trigger waiting for its config, per kind, with the delegate's scope. */
const pending = new WeakMap<Element, Map<ClaimKind, {event: Press; scope: DelegateScope}[]>>();
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

/**
 * The `pointerdown` a claim mark (`mark`) of `el` holds, if it applies to the press whose
 * `pointerdown` is `pointerDown`: the same event; or — when that `pointerdown` wasn't on `el` at
 * all (a synthetic or screen-reader `mousedown`, no `pointerdown` of its own) — the element's last.
 */
function claimFor(el: Element, mark: string, pointerDown: Event | undefined): Event | undefined {
  const claim = expando<Event>(el, mark);
  if (!claim) return undefined;
  if (claim === pointerDown) return claim;
  const downTarget = expando<Node>(pointerDown, POINTER_TARGET);
  return downTarget && containsComposed(el, downTarget) ? undefined : claim;
}

/** Whether `node` is `el` or inside it, through shadow roots (a shadow root to its host). */
function containsComposed(el: Element, node: Node): boolean {
  for (let n: Node | null = node; n; n = n.parentNode ?? (n as ShadowRoot).host ?? null) {
    if (n === el) return true;
  }
  return false;
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

/**
 * Launches `event`'s ripple from `trigger` with `config`, and listens for its release. `kind`:
 * the trigger's own kind's ripple (`dom`) or an additional one (`own`).
 */
function launch(trigger: Element, event: Press, config: RippleClaimConfig, kind: ClaimKind): void {
  const loader = kind === 'dom' && isLoaderHost(trigger);
  // The press that created a loader host's ripple element launches none in it (upstream: its
  // listener is added during that very dispatch); hosts it initialized are on the event. Only
  // that ripple: an own claim's, in its own container, launches.
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
 * innermost target (`composedPath()[0]`, through shadow roots) up — see the module doc comment —
 * with `scope`'s options for the unclaimed ones. Once per event: a second delegate on the page
 * finds it handled.
 */
export function launchDelegatedRipples(event: Press, scope: DelegateScope): void {
  if (expando(event, HANDLED)) return;
  (event as unknown as Expandos)[HANDLED] = true;
  const target = (event.composedPath?.()[0] ?? event.target) as Node | null;
  const view = target?.ownerDocument?.defaultView;
  // The press's own `pointerdown`, copied onto it at dispatch (this may run after a later press).
  const pointerDown = expando<Event>(event, POINTER_DOWN) ?? expando<Event>(view, POINTER_DOWN);
  for (
    let el: Element | null =
      target?.nodeType === 1 ? (target as Element) : (target?.parentElement ?? null);
    el;
    el = parentOf(el)
  ) {
    if (!claimFor(el, VETO, pointerDown)) {
      const domClaim = claimFor(el, DOM_CLAIM, pointerDown);
      if (domClaim) {
        launchClaim(el, 'dom', domClaim, pointerDown, event, scope);
      } else {
        const config = domConfig(el, scope);
        if (config) launch(el, event, config, 'dom');
      }
    }
    const ownClaim = claimFor(el, CLAIM, pointerDown);
    if (ownClaim) launchClaim(el, 'own', ownClaim, pointerDown, event, scope);
  }
}

/** An element's parent, across a shadow root to its host. */
function parentOf(el: Element): Element | null {
  if (el.parentElement) return el.parentElement;
  const root = el.parentNode;
  return root && root.nodeType === 11 ? ((root as ShadowRoot).host ?? null) : null;
}

/**
 * Launches `el`'s `kind` claim (made by `claim`): with its registered config for that claim; or,
 * still loading, queues the press; for an old claim (a press without its own `pointerdown`), with
 * whatever config it last registered.
 */
function launchClaim(
  el: Element,
  kind: ClaimKind,
  claim: Event,
  pointerDown: Event | undefined,
  event: Press,
  scope: DelegateScope,
): void {
  const registered = configs.get(el)?.get(kind);
  if (registered && (registered.claim === claim || claim !== pointerDown)) {
    launch(el, event, withScope(registered.config, scope), kind);
  } else if (claim === pointerDown) {
    let byKind = pending.get(el);
    if (!byKind) pending.set(el, (byKind = new Map()));
    byKind.set(kind, [...(byKind.get(kind) ?? []), {event, scope}]);
  }
}

/** A claim's config, the delegate's global options when it brought none. */
function withScope(config: RippleClaimConfig, scope: DelegateScope): RippleClaimConfig {
  return config.globalOptions ? config : {...config, globalOptions: scope.globalOptions};
}

/**
 * A claim's config for the press `claim` (its `pointerdown`) started — called by the claim's own
 * handler (`rippleClaimProps()`'s `register$`), with the config its component's closure holds.
 * `kind`: an additional ripple (`own`, the default) or the element's kind's (`dom`). Launches the
 * presses that waited for it.
 */
export function registerRippleClaim(
  trigger: Element,
  claim: Event,
  config: RippleClaimConfig,
  kind: ClaimKind = 'own',
): void {
  let byKind = configs.get(trigger);
  if (!byKind) configs.set(trigger, (byKind = new Map()));
  byKind.set(kind, {claim, config});
  const queue = pending.get(trigger)?.get(kind);
  if (!queue) return;
  pending.get(trigger)!.delete(kind);
  for (const {event, scope} of queue) launch(trigger, event, withScope(config, scope), kind);
}
