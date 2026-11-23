import {$, sync$, useContextProvider, useOnDocument, type QRL} from '@qwik.dev/core';
import {useAnimationsDisabled} from '../../dialog/use-animations-disabled';
import type {HostProps} from '../host-props';
import {MAT_RIPPLE_DELEGATE} from './ripple-delegate-context';
import {launchDelegatedRipples} from './ripple-delegate-dom';
import {useRippleGlobalOptions} from './ripple-global-options';

/**
 * Installs the ripple delegate: the ONE set of document listeners every qwik-material ripple on
 * the page goes through (ripple-delegate-dom.ts) — upstream's `RippleEventManager` and
 * `MatRippleLoader`, each one document-level listener per event type. Call it once, near the
 * root, AFTER any root-level `useMatRippleProvider()`/`useMatAnimationsProvider()` (it captures
 * the options in force where it's called; a provider nested below it hands its subtree's hosts
 * their own options, through a claim). Without it, no ripple launches.
 *
 * `useOnDocument()` puts its `q-d:*` attributes on this component's first element, once per page:
 *
 * - `mouseover`, `focusin`, `mousedown`, `touchstart` — {@link initializeLoaderRipple}
 *   (synchronous, no chunk): a button-family host's lazy ripple element.
 * - `pointerdown` — records the press, to tell a host's claim for THIS press from an old one.
 * - `mousedown`, `touchstart` — {@link launchDelegatedRipples} (this one loads the ripple chunk,
 *   on the page's first press).
 * - `mouseup`, `touchend`, `touchcancel`, `mouseout` — record releases and leaves (synchronous),
 *   for a launch that runs only after its press ended (the first, while the chunk loads).
 *
 * All passive: nothing here cancels an event.
 */
export function useMatRippleDelegate(): void {
  const globalOptions = useRippleGlobalOptions();
  const animationsDisabled = useAnimationsDisabled();
  useContextProvider(MAT_RIPPLE_DELEGATE, true);
  const passive = {passive: true} as const;
  useOnDocument(
    ['mouseover', 'focusin', 'mousedown', 'touchstart'],
    initializeLoaderRipple,
    passive,
  );
  useOnDocument('pointerdown', recordPointerDown, passive);
  useOnDocument(
    ['mousedown', 'touchstart'],
    $((event: Event) =>
      launchDelegatedRipples(event as MouseEvent | TouchEvent, {
        globalOptions,
        animationsDisabled: animationsDisabled.value,
      }),
    ),
    passive,
  );
  useOnDocument(['mouseup', 'touchend', 'touchcancel'], recordRelease, passive);
  useOnDocument('mouseout', recordLeave, passive);
}

/**
 * Upstream `MatRippleLoader._onInteraction` + `_createRipple`, synchronously at the event (a
 * `sync$`, inlined into the page — no chunk): the uninitialized button-family loader host(s) the
 * pointer is over or pressing — every one from the target up, as `mouseenter` reached each
 * before — or the focused one, lose `mat-ripple-loader-uninitialized` and get their
 * `<span class="mat-ripple {className}">` as last child. Imperatively, as upstream: the host
 * renders that attribute as a CONSTANT prop (Qwik never re-diffs one) and the span is a node Qwik
 * didn't render (no `:` attribute — skipped when it builds its vnodes from the DOM), so no
 * re-render undoes either. Records the hosts on the event (a press that initializes a host launches
 * no ripple on it) and marks each (`wasRippleInitialized()`).
 *
 * Strings, not the ripple-delegate-dom.ts constants: a `sync$` is serialized on its own.
 */
export const initializeLoaderRipple = sync$((event: Event): void => {
  const target = event.target as Element | null;
  if (!target || target.nodeType !== 1) return;
  // This event's place among the presses, releases and leaves (see `recordRelease`).
  const w = (target.ownerDocument.defaultView || {}) as unknown as Record<string, number>;
  (event as unknown as Record<string, number>)['__matRippleSeq'] = w['__matRippleSeq'] =
    (w['__matRippleSeq'] || 0) + 1;
  const attr = 'mat-ripple-loader-uninitialized';
  const focus = event.type === 'focusin';
  let host: Element | null = focus
    ? target.hasAttribute(attr)
      ? target
      : null
    : target.closest('[' + attr + ']');
  while (host) {
    const className = host.getAttribute('mat-ripple-loader-class-name');
    if (className === 'mat-mdc-button-ripple') {
      host.removeAttribute(attr);
      const span = host.ownerDocument.createElement('span');
      span.className = 'mat-ripple ' + className;
      host.appendChild(span);
      (host as unknown as Record<string, unknown>)['__matRippleLoaderInitialized'] = true;
      const boot = event as unknown as Record<string, Element[]>;
      (boot['__matRippleBoot'] = boot['__matRippleBoot'] || []).push(host);
    }
    host = focus || !host.parentElement ? null : host.parentElement.closest('[' + attr + ']');
  }
});

/** The press's `pointerdown`, for `launchDelegatedRipples()` to match claims against. */
export const recordPointerDown = sync$((event: Event): void => {
  const view = (event.target as Node | null)?.ownerDocument?.defaultView;
  if (view) (view as unknown as Record<string, unknown>)['__matRipplePointerDown'] = event;
});

/**
 * The last release, as its place in the sequence `initializeLoaderRipple` numbers presses in: a
 * launch running after it fades out at once. A sequence, not `timeStamp`s: a release can carry
 * its press's very timestamp (synthesized input, coarse clocks).
 */
export const recordRelease = sync$((event: Event): void => {
  const w = ((event.target as Node | null)?.ownerDocument?.defaultView || {}) as unknown as Record<
    string,
    number
  >;
  w['__matRippleRelease'] = w['__matRippleSeq'] = (w['__matRippleSeq'] || 0) + 1;
});

/** When the pointer left each element it left: a launch running after that fades out at once. */
export const recordLeave = sync$((event: MouseEvent): void => {
  const w = ((event.target as Node | null)?.ownerDocument?.defaultView || {}) as unknown as Record<
    string,
    number
  >;
  const seq = (w['__matRippleSeq'] = (w['__matRippleSeq'] || 0) + 1);
  const to = event.relatedTarget as Node | null;
  for (let el = event.target as Element | null; el && el.nodeType === 1; el = el.parentElement) {
    if (to && el.contains(to)) break;
    (el as unknown as Record<string, unknown>)['__matRippleLeftAt'] = seq;
  }
});

/** A claim vetoing this press's ripple on its element (ripple disabled by a non-DOM input). */
export const vetoRipple = sync$((event: Event, el: Element): void => {
  (el as unknown as Record<string, unknown>)['__matRippleClaim'] = [event, 0];
});

/** A claim for this press, its config to follow from the claimant's own handler. */
export const claimRipple = sync$((event: Event, el: Element): void => {
  (el as unknown as Record<string, unknown>)['__matRippleClaim'] = [event, 1];
});

/**
 * Host props claiming the element they're spread on — a ripple trigger whose config the delegate
 * can't read from the DOM (see ripple-delegate-dom.ts): ONE `pointerdown` handler instead of a
 * handler per pointer event. `register$` — the claimant's own `$()`, closing over what its config
 * needs — calls `registerRippleClaim(el, event, config)` with them, per press; without it, the
 * claim vetoes the trigger's ripple (a `sync$`: no chunk).
 */
export function rippleClaimProps(
  register$?: QRL<(event: PointerEvent, el: Element) => void>,
): HostProps {
  return {onPointerDown$: register$ ? [claimRipple, register$] : vetoRipple};
}
