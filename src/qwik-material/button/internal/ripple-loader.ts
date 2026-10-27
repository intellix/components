import {$, type Signal, useOn, useSignal} from '@builder.io/qwik';

/**
 * Reproduces `MatRippleLoader`'s lazy-ripple contract
 * (`src/material/core/private/ripple-loader.ts`) on a button-family host.
 *
 * Upstream attaches the host attributes below synchronously (in the
 * directive's constructor / input setters) and only creates the real
 * `.mat-ripple` `<span>` the first time the host receives one of
 * `focus`/`mousedown`/`mouseenter`/`touchstart`. The ripple *animation*
 * itself (MatRipple/RippleRenderer) is out of scope for DOM parity — only
 * the static attribute swap + span insertion needs to match Angular's DOM
 * (see button/SYNC.md).
 */
export interface RippleLoaderConfig {
  /** Extra class the lazily-created `.mat-ripple` span gets — upstream's `className`. */
  className: string;
  /** Upstream's `configureRipple({centered: true})` — only MatIconButton passes this. */
  centered?: boolean;
  /** Upstream's `disableRipple || disabled` at construction/input-set time. */
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
const DISABLED_ATTR = 'mat-ripple-loader-disabled';

/**
 * SSR-rendered host attributes equivalent to upstream's
 * `MatRippleLoader.configureRipple()` call — the parts that never change
 * again after the initial render. Spread onto the same host element that
 * `useRippleLoader` attaches to, e.g.:
 * ```tsx
 * <button
 *   {...rippleLoaderHostAttrs({className: 'mat-mdc-button-ripple'})}
 *   mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
 * >
 * ```
 *
 * Deliberately excludes `RIPPLE_UNINITIALIZED_ATTR` itself (upstream's
 * `matRippleUninitialized`, removed by `_createRipple` once the ripple is
 * actually created) even though that one DOES change after the initial
 * render, driven by `useRippleLoader()`'s signal: a Qwik JSX **spread**
 * prop (`{...someObject}`) whose value becomes `undefined` after a
 * client-side re-render does NOT reliably get removed from the live DOM
 * following SSR + resume, even though everything else about that re-render
 * (e.g. this same component's text content, or a `{signal.value && <span/>}`
 * conditional child) patches correctly — confirmed empirically with a
 * minimal repro (a `custom-uninitialized` attr toggled via spread never
 * disappeared after resume, but the exact same toggle written as a literal
 * `custom-uninitialized={signal.value ? undefined : ''}` JSX attribute
 * removed it correctly). Each caller therefore writes
 * `mat-ripple-loader-uninitialized={...}` (the literal string
 * `RIPPLE_UNINITIALIZED_ATTR` names) as its own plain JSX attribute,
 * inline, reading the signal directly in the attribute expression — not
 * through an intermediate variable, and not through this function's
 * spread — alongside the rest of these attrs.
 */
export function rippleLoaderHostAttrs(config: RippleLoaderConfig): Record<string, string> {
  const attrs: Record<string, string> = {
    [CLASS_NAME_ATTR]: config.className,
  };
  if (config.centered) attrs[CENTERED_ATTR] = '';
  if (config.disabled) attrs[DISABLED_ATTR] = '';
  return attrs;
}

/**
 * Client-side half of the ripple-loader contract — the lazy, per-instance
 * replacement for a `useVisibleTask$`-based listener setup (rule 7 of the
 * DOM-parity remediation design: no per-instance `useVisibleTask$` for
 * interaction plumbing in components that appear many times per page).
 *
 * `useOn()` only attaches serialized `on:<event>` references to this
 * component's own host element at SSR/render time (same mechanism as
 * `qwik-cdk/a11y`'s `useFocusOrigin()`) — the handler's chunk is downloaded
 * and run by qwikloader the FIRST time one of
 * focus/mousedown/mouseenter/touchstart actually fires on the host, never
 * before. This mirrors upstream `MatRippleLoader`'s own lazy-interaction
 * contract (it defers constructing the real `MatRipple` the same way, just
 * via one document-level delegated listener instead of per-host
 * attributes).
 *
 * Returns a `Signal<boolean>`: `false` until a qualifying event fires, then
 * `true` forever (idempotent — later events are harmless no-op writes of
 * the same value). The caller renders BOTH the host's
 * `mat-ripple-loader-uninitialized` attribute, as its own literal JSX
 * attribute — `mat-ripple-loader-uninitialized={rippleInitialized.value ?
 * undefined : ''}` — AND the lazily-created `<span class="mat-ripple
 * …">` itself DECLARATIVELY from this signal's value, e.g.
 * `{rippleInitialized.value && <span class="mat-ripple
 * mat-mdc-button-ripple" />}` as the host's last JSX child (mirrors
 * upstream's `_createRipple` appending it as the host's last child) — see
 * mat-button.tsx and friends.
 *
 * This is deliberately NOT "mutate the live DOM directly inside the event
 * handler", which is what this hook did on an earlier pass and what a first
 * attempt naturally reaches for. That version broke the moment MatButton
 * also started deriving its `cdk-*-focused` classes from
 * `useFocusOrigin()`'s signal (qwik-cdk/a11y): a single click fires both a
 * ripple-triggering event AND a focus event, and `useFocusOrigin()`'s signal
 * write triggers Qwik to reconcile the WHOLE component's vnode tree on the
 * next render — which silently undid the imperative mutation (observed
 * empirically: the appended `.mat-ripple` span got pruned and the removed
 * `uninitialized` attribute came back, because neither exists in the vnode
 * Qwik was reconciling against). Routing ripple state through a signal
 * instead — the same pattern `useFocusOrigin()` itself uses — keeps it
 * correct across a re-render for ANY reason, not just the one active during
 * manual testing. General lesson for this host: once ANY part of a
 * component's render depends on a signal, nothing else may mutate that
 * component's DOM imperatively — it has to go through a signal too.
 */
export function useRippleLoader(): Signal<boolean> {
  const initialized = useSignal(false);

  const markInitialized$ = $(() => {
    initialized.value = true;
  });

  useOn('focus', markInitialized$);
  useOn('mousedown', markInitialized$);
  useOn('mouseenter', markInitialized$);
  useOn('touchstart', markInitialized$);

  return initialized;
}
