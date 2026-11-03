import {$, type Signal, useOn, useSignal} from '@qwik.dev/core';
import {handleRippleEvent, rippleAnimationConfig} from '../../core/ripple/ripple-dom';
import {useRippleGlobalOptions} from '../../core/ripple/ripple-global-options';
import {useAnimationsDisabled} from '../../dialog/use-animations-disabled';

/**
 * Reproduces `MatRippleLoader`'s lazy-ripple contract
 * (`src/material/core/private/ripple-loader.ts`) on a chip host. Identical
 * mechanism to `qwik-material/button/internal/ripple-loader.ts` (see that
 * file's own doc comment and `button/SYNC.md` for the full reasoning) —
 * duplicated here rather than imported cross-entry-point, matching this
 * package's convention of each entry point owning its own `internal/`
 * helpers (button-toggle, grid-list, etc. all do the same for their
 * family-local internals).
 *
 * Upstream (`chip.ts`'s constructor) attaches the host attributes below
 * synchronously and only creates the real `.mat-ripple` `<span>` the first
 * time the host receives one of `focus`/`mousedown`/`mouseenter`/
 * `touchstart`. The ripple *animation* itself (MatRipple/RippleRenderer) is
 * out of scope for DOM parity — only the static attribute swap + span
 * insertion needs to match Angular's DOM (see chips/SYNC.md).
 */
export interface RippleLoaderConfig {
  /** Extra class the lazily-created `.mat-ripple` span gets — upstream's `className`. */
  className: string;
  /** Upstream's `configureRipple({centered: true})` — unused by chips (no caller passes it). */
  centered?: boolean;
  /** Upstream's `disabled` at construction/input-set time. Chips recompute this on every
   *  render instead of freezing it (see mat-chip.tsx) — this field is intentionally unused
   *  by {@link rippleLoaderHostAttrs} for chips; disabled is rendered as its own reactive
   *  JSX attribute instead, for the same "spread doesn't reliably remove after resume"
   *  reason documented below. */
  disabled?: boolean;
}

/**
 * Exported so callers can render it as their own literal JSX attribute —
 * see `rippleLoaderHostAttrs()`'s doc comment for why it can't be part of
 * that function's spread.
 */
export const RIPPLE_UNINITIALIZED_ATTR = 'mat-ripple-loader-uninitialized';
const CLASS_NAME_ATTR = 'mat-ripple-loader-class-name';
const CENTERED_ATTR = 'mat-ripple-loader-centered';

/**
 * SSR-rendered host attributes equivalent to upstream's
 * `MatRippleLoader.configureRipple()` call — the parts that never change
 * again after the initial render (the className, and `centered` when set).
 * `mat-ripple-loader-disabled` is NOT included here for chips — unlike
 * button (whose `disabled`/`disableRipple` rarely change post-mount),
 * a chip's ripple-disabled condition depends on `_hasInteractiveActions()`,
 * which can only be known once the component's own props are read — the
 * caller renders it as its own literal, reactive JSX attribute instead
 * (`mat-ripple-loader-disabled={rippleDisabled ? '' : undefined}`), same
 * reasoning as `RIPPLE_UNINITIALIZED_ATTR` below.
 *
 * Deliberately excludes `RIPPLE_UNINITIALIZED_ATTR` itself (upstream's
 * `matRippleUninitialized`, removed by `_createRipple` once the ripple is
 * actually created) even though that one DOES change after the initial
 * render: a Qwik JSX **spread** prop whose value becomes `undefined` after
 * a client-side re-render does NOT reliably get removed from the live DOM
 * following SSR + resume (confirmed empirically in button's own port —
 * see its `ripple-loader.ts`). Each caller therefore writes
 * `mat-ripple-loader-uninitialized={...}` as its own plain JSX attribute,
 * inline, reading the signal directly — not through this function's
 * spread.
 */
export function rippleLoaderHostAttrs(config: RippleLoaderConfig): Record<string, string> {
  const attrs: Record<string, string> = {
    [CLASS_NAME_ATTR]: config.className,
  };
  if (config.centered) attrs[CENTERED_ATTR] = '';
  return attrs;
}

/**
 * Client-side half of the ripple-loader contract — the lazy, per-instance
 * replacement for a `useVisibleTask$`-based listener setup (design doc rule
 * 7: no per-instance `useVisibleTask$` for interaction plumbing in
 * components that appear many times per page — a chip set can have many).
 *
 * `useOn()` only attaches serialized `on:<event>` references to this
 * component's own host element at SSR/render time — the handler's chunk is
 * downloaded and run by qwikloader the FIRST time one of
 * focus/mousedown/mouseenter/touchstart actually fires on the host, never
 * before.
 *
 * Returns a `Signal<boolean>`: `false` until a qualifying event fires, then
 * `true` forever. The caller renders BOTH the host's
 * `mat-ripple-loader-uninitialized` attribute AND the lazily-created
 * `<span class="mat-ripple …">` itself DECLARATIVELY from this signal's
 * value, as the host's LAST JSX child (mirrors upstream's `_createRipple`
 * appending it as the host's last child, after the trailing cell if any).
 *
 * The real ripple ANIMATION (added alongside the ripple-span bootstrap
 * above, same `core/ripple/`-remediation pass as `qwik-material/button`'s
 * identical hook — see that file's own doc comment for the full writeup of
 * why a `mousedown`/`touchstart` that bootstraps the span itself never gets
 * a ripple, only every interaction after it): on `mousedown`/`touchstart`,
 * if the `.mat-ripple` span already exists, read `mat-ripple-loader-disabled`
 * directly off the live host attribute (this file's own doc comment above
 * explains why chips render that one reactively rather than through
 * `rippleLoaderHostAttrs()`'s spread — reading it live here means this
 * works regardless of which path put it there) and launch into it.
 */
export function useRippleLoader(): Signal<boolean> {
  const initialized = useSignal(false);
  const animationsDisabled = useAnimationsDisabled();
  const rippleGlobalOptions = useRippleGlobalOptions();

  const handleInteraction$ = $((event: Event, host: Element) => {
    if (event.type === 'focusin' || event.type === 'mouseenter') {
      initialized.value = true;
      return;
    }
    if (event.type === 'mousedown' || event.type === 'touchstart') {
      initialized.value = true;
    }

    const container = host.querySelector<HTMLElement>('.mat-ripple');
    if (!container) return;

    handleRippleEvent(
      event as MouseEvent | TouchEvent,
      container,
      {
        rippleDisabled: host.hasAttribute('mat-ripple-loader-disabled'),
        rippleConfig: {
          centered: host.hasAttribute(CENTERED_ATTR),
          animation: rippleAnimationConfig(animationsDisabled.value),
        },
      },
      rippleGlobalOptions,
    );
  });

  // `focusin`, not `focus`: the qualifying focus almost always lands on a DESCENDANT (the
  // chip's inner `<button>`/gridcell span), never the chip's own host element directly —
  // `focus` does not bubble (confirmed live: a `useOn('focus', ...)` version here never once
  // fired through `FocusKeyManager`-driven keyboard navigation, e.g. `listbox-single`'s
  // `ArrowLeft` landing keyboard focus on "Medium", which real Angular DOES initialize the
  // ripple container for). `focusin` is the bubbling counterpart and reaches the host the
  // same way `qwik-cdk/a11y`'s `useFocusOrigin()` already relies on it to. ALL eight events
  // (including the pointer-up quartet) share this ONE `$()` reference — see button's
  // identical hook / core/ripple/ripple-renderer.ts's module doc comment for why that's not
  // just tidy (cross-chunk QRL ordering).
  useOn('focusin', handleInteraction$);
  useOn('mousedown', handleInteraction$);
  useOn('mouseenter', handleInteraction$);
  useOn('touchstart', handleInteraction$);
  useOn('mouseup', handleInteraction$);
  useOn('mouseleave', handleInteraction$);
  useOn('touchend', handleInteraction$);
  useOn('touchcancel', handleInteraction$);

  return initialized;
}
