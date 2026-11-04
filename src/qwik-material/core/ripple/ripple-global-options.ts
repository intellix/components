import {createContextId, useContext, useContextProvider} from '@qwik.dev/core';
import type {RippleAnimationConfig} from './ripple-ref';

/**
 * Qwik port of upstream's `RippleGlobalOptions`/`MAT_RIPPLE_GLOBAL_OPTIONS`
 * (`src/material/core/ripple/ripple.ts`). Provided app-wide via
 * `useMatRippleProvider({...})`, read by every ripple-bearing consumer — the
 * standalone `useMatRipple()` hook AND every built-in component that already
 * renders a ripple through `handleRippleEvent()` (`ripple-dom.ts`) — via
 * {@link useRippleGlobalOptions}.
 *
 * Dropped relative to upstream: `namespace` (`RippleGlobalOptions.namespace`)
 * — upstream's own doc comment says it exists only so `MatRippleLoader`'s
 * on-demand bootstrap attributes can coexist across multiple independent
 * Angular app instances sharing one page (a multi-root-injector DI concern).
 * This port's ripple-loader equivalents (`button/internal/ripple-loader.ts`
 * and friends) are plain per-container `WeakMap` caches keyed by DOM element
 * identity (`ripple-registry.ts`), not a namespaced global registry, so
 * there's nothing for a `namespace` to disambiguate here.
 */
export interface RippleGlobalOptions {
  /**
   * Whether ripples should be disabled app-wide. Ripples can still be
   * launched manually via `useMatRipple().launch$` — focus indicators are
   * unaffected either way. Mirrors upstream's identical doc comment.
   */
  disabled?: boolean;

  /**
   * Default animation durations for every ripple that doesn't override them
   * itself (`matRippleAnimation`/`UseMatRippleProps.animation`) and isn't
   * overridden by `animationsDisabled`. Mirrors upstream's `animation`.
   */
  animation?: RippleAnimationConfig;

  /**
   * Whether ripples should start fading out immediately once the pointer is
   * released, even mid-enter-animation. Mirrors upstream's identical doc
   * comment. Upstream only ever reads this from the global options — no
   * per-ripple input exists for it, matched here (no `UseMatRippleProps`
   * field either).
   */
  terminateOnPointerUp?: boolean;
}

/** Injection-token equivalent of upstream's `MAT_RIPPLE_GLOBAL_OPTIONS`. */
export const MAT_RIPPLE_GLOBAL_OPTIONS = createContextId<RippleGlobalOptions>(
  'qwikMaterial/rippleGlobalOptions',
);

/**
 * Reads `MAT_RIPPLE_GLOBAL_OPTIONS`, falling back to `{}` (every field
 * un-set, i.e. upstream's own "no provider" behaviour: `inject(...,
 * {optional: true}) || {}`) when no `<QwikMaterialProvider
 * matRippleConfig={...}>` ancestor provided one. A plain object — safe to
 * capture directly into a `$()` event-handler closure (see
 * `use-mat-ripple.ts`'s doc comment), same as every other `MAT_*_CONFIG`
 * this port already threads this way (`MAT_BUTTON_CONFIG`, `MAT_CHIPS_CONFIG`, …).
 */
export function useRippleGlobalOptions(): RippleGlobalOptions {
  return useContext(MAT_RIPPLE_GLOBAL_OPTIONS, {});
}

/**
 * Provides {@link MAT_RIPPLE_GLOBAL_OPTIONS} for this subtree — call once near the root (or
 * anywhere deeper, to override just that part of the tree) so every ripple-bearing consumer
 * (the standalone `useMatRipple()`/`<MatRipple>` AND every built-in component's own internal
 * ripple) resolves its options from `options` instead of the "no provider" `{}` default. Only
 * this one context is provided; every other qwik-material configuration context stays
 * whatever an ancestor (or nothing) already provided.
 */
export function useMatRippleProvider(options?: RippleGlobalOptions): void {
  useContextProvider(MAT_RIPPLE_GLOBAL_OPTIONS, options ?? {});
}
