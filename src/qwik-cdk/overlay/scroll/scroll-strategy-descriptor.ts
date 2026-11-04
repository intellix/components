/**
 * Serializable scroll-strategy configuration.
 *
 * New (no direct CDK equivalent — upstream configures a scroll strategy by
 * injecting `ScrollStrategyOptions` and calling one of its methods
 * (`.block()`, `.reposition({...})`, …) directly, synchronously, wherever
 * an overlay is opened — there's no cross-render-boundary capture to worry
 * about in Angular). This port's own provider hooks (e.g. `useMatDialogProvider`
 * matDialogScrollStrategy={…}>`-style config DOES cross such a boundary: the
 * value is read via `useContext()` in one render (the opener's) and has to
 * still be usable later, in a QRL invoked after a real SSR→CSR resume. A
 * plain `() => ScrollStrategy` factory function doesn't survive that trip
 * (functions aren't serializable at all, `ScrollStrategy` instances even
 * less so — see `qwik-material/menu/SYNC.md`'s "scroll strategy lost after
 * resume" entry for the full incident writeup and the two dead ends tried
 * before this).
 *
 * A `ScrollStrategyDescriptor` is either a plain string/object (fully
 * serializable — survives resume like any other config value, no special
 * handling needed) naming one of the four built-in strategies, or a `QRL`
 * (Qwik's own resumable function reference, the same mechanism
 * `onBackdropClick$`/`onKeydown$`/etc. already use for exactly this reason)
 * for anything the four built-ins don't cover.
 */
import type {QRL} from '@qwik.dev/core';
import type {ScrollStrategy} from './scroll-strategy';
import {createNoopScrollStrategy} from './noop-scroll-strategy';
import {createBlockScrollStrategy} from './block-scroll-strategy';
import {createCloseScrollStrategy, type CloseScrollStrategyConfig} from './close-scroll-strategy';
import {
  createRepositionScrollStrategy,
  type RepositionScrollStrategyConfig,
} from './reposition-scroll-strategy';

/**
 * One of the four built-in scroll strategies, as plain (fully
 * serializable) data — either its bare name, taking every default, or an
 * object naming it plus its own config fields.
 */
export type BuiltinScrollStrategyDescriptor =
  | 'noop'
  | 'block'
  | {type: 'noop'}
  | {type: 'block'}
  | ({type: 'reposition'} & RepositionScrollStrategyConfig)
  | ({type: 'close'} & CloseScrollStrategyConfig);

/**
 * A `BuiltinScrollStrategyDescriptor`, or a `QRL` escape hatch for a fully
 * custom `ScrollStrategy` the four built-ins don't model. The QRL form is
 * async to resolve (a QRL invocation is always a `Promise`, even when the
 * underlying function is synchronous) — callers needing it go through
 * `resolveScrollStrategyDescriptor` (`await`ed); the sync-only
 * `resolveBuiltinScrollStrategyDescriptor` stays available for call sites
 * (e.g. the plain, synchronous CDK `Overlay.create()`) that intentionally
 * don't support the QRL form.
 */
export type ScrollStrategyDescriptor = BuiltinScrollStrategyDescriptor | QRL<() => ScrollStrategy>;

/** True for every `ScrollStrategyDescriptor` except the `QRL` escape hatch. */
export function isBuiltinScrollStrategyDescriptor(
  descriptor: ScrollStrategyDescriptor,
): descriptor is BuiltinScrollStrategyDescriptor {
  return (
    typeof descriptor === 'string' ||
    (typeof descriptor === 'object' && descriptor !== null && 'type' in descriptor)
  );
}

/** Builds the real `ScrollStrategy` instance a `BuiltinScrollStrategyDescriptor` names. */
export function resolveBuiltinScrollStrategyDescriptor(
  descriptor: BuiltinScrollStrategyDescriptor,
): ScrollStrategy {
  if (descriptor === 'noop') return createNoopScrollStrategy();
  if (descriptor === 'block') return createBlockScrollStrategy();
  switch (descriptor.type) {
    case 'noop':
      return createNoopScrollStrategy();
    case 'block':
      return createBlockScrollStrategy();
    case 'reposition':
      return createRepositionScrollStrategy(descriptor);
    case 'close':
      return createCloseScrollStrategy(descriptor);
  }
}

/**
 * Builds the real `ScrollStrategy` instance a `ScrollStrategyDescriptor`
 * names — the built-in cases resolve synchronously (no `await` actually
 * suspends), the `QRL` escape hatch invokes and awaits it. Always returns
 * a `Promise` (a QRL call always does), so callers that only ever pass the
 * built-in forms and want to stay fully synchronous should use
 * `resolveBuiltinScrollStrategyDescriptor` directly instead.
 */
export async function resolveScrollStrategyDescriptor(
  descriptor: ScrollStrategyDescriptor,
): Promise<ScrollStrategy> {
  if (isBuiltinScrollStrategyDescriptor(descriptor)) {
    return resolveBuiltinScrollStrategyDescriptor(descriptor);
  }
  return await descriptor();
}

/**
 * True for a real, already-built `ScrollStrategy` instance (identified
 * structurally — every `ScrollStrategy` has `attach`/`enable`/`disable`
 * methods; a `BuiltinScrollStrategyDescriptor` object instead has a `type`
 * string field, and a `QRL` is a function, not a plain object), as opposed
 * to a `ScrollStrategyDescriptor`. Per-call config fields
 * (`MatDialogConfig.scrollStrategy`, …) accept either shape — a consumer
 * who already has a real instance (e.g. built via `useScrollStrategyOptions()`
 * directly) can keep passing it unchanged.
 */
export function isScrollStrategyInstance(
  value: ScrollStrategy | ScrollStrategyDescriptor | undefined,
): value is ScrollStrategy {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ScrollStrategy).enable === 'function' &&
    typeof (value as ScrollStrategy).disable === 'function'
  );
}

/**
 * Resolves a per-call `ScrollStrategy | ScrollStrategyDescriptor | undefined`
 * override against a context-level `ScrollStrategyDescriptor` default — the
 * shape every one of this port's "open a {dialog,bottom sheet,select,menu,
 * autocomplete} overlay" call sites needs. Always async (see
 * `resolveScrollStrategyDescriptor`).
 */
export async function resolveConfiguredScrollStrategy(
  perCall: ScrollStrategy | ScrollStrategyDescriptor | undefined,
  contextDefault: ScrollStrategyDescriptor,
): Promise<ScrollStrategy> {
  if (isScrollStrategyInstance(perCall)) return perCall;
  return await resolveScrollStrategyDescriptor(perCall ?? contextDefault);
}
