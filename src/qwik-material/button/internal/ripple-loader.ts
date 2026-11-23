import {$} from '@qwik.dev/core';
import type {HostProps} from '../../core/host-props';
import {noRippleDelegateProps, rippleClaimProps} from '../../core/ripple/ripple-delegate';
import {useRippleDelegated} from '../../core/ripple/ripple-delegate-context';
import {registerRippleClaim} from '../../core/ripple/ripple-delegate-dom';
import {rippleAnimationConfig} from '../../core/ripple/ripple-dom';
import {useRippleGlobalOptions} from '../../core/ripple/ripple-global-options';
import {useAnimationsDisabled} from '../../dialog/use-animations-disabled';

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
 * SSR-rendered host attributes equivalent to upstream's `MatRippleLoader.configureRipple()` call,
 * spread onto the host before `useRippleLoader()`'s props and the literal uninitialized attribute:
 * ```tsx
 * <button
 *   {...rippleLoaderHostAttrs({className: 'mat-mdc-button-ripple'})}
 *   {...rippleLoader}
 *   mat-ripple-loader-uninitialized=""
 * >
 * ```
 *
 * Excludes `RIPPLE_UNINITIALIZED_ATTR` (upstream's `matRippleUninitialized`, removed by
 * `_createRipple` once the ripple exists): the ripple delegate removes it, and only a literal,
 * constant JSX attribute — written last, after every spread — is one Qwik never writes again.
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
 * The client half of the ripple-loader contract, for a button-family host: the host props to
 * spread on it, next to `rippleLoaderHostAttrs()` and the literal
 * `mat-ripple-loader-uninitialized=""` (its LAST attribute: a constant prop Qwik sets once and
 * never re-diffs, so the delegate's removal of it sticks).
 *
 * Under the ripple delegate (`useMatRippleDelegate()`, core/ripple/ripple-delegate.ts) — the
 * upstream design: `MatRippleLoader` is one document-level listener — that is NOTHING: the
 * delegate creates the `.mat-ripple` span on the first `mouseover`/`focusin`/`mousedown`/
 * `touchstart` (synchronously, upstream's `_createRipple`) and launches ripples with the config
 * read off these attributes. Before, each host carried eight `q-e:*` handlers (a `sync$` and one
 * QRL capturing a signal) and re-rendered a `LazyRipple` child to add the span.
 *
 * Below a nested `useMatRippleProvider()`/`useMatAnimationsProvider()`, the host CLAIMS its
 * presses instead — one `pointerdown` handler handing the delegate the options in
 * force here (`rippleClaimProps()`); the span and the attributes still come from the delegate.
 */
export function useRippleLoader(): HostProps {
  const delegated = useRippleDelegated();
  if (delegated === null) return noRippleDelegateProps();
  return delegated ? {} : useClaimedRippleLoader();
}

/** The claim for a loader host outside the delegate's options scope. */
function useClaimedRippleLoader(): HostProps {
  const animationsDisabled = useAnimationsDisabled();
  const rippleGlobalOptions = useRippleGlobalOptions();
  return rippleClaimProps(
    $((event: PointerEvent, host: Element) =>
      registerRippleClaim(
        host,
        event,
        {
          target: {
            rippleDisabled: host.hasAttribute(DISABLED_ATTR),
            rippleConfig: {
              centered: host.hasAttribute(CENTERED_ATTR),
              animation: rippleAnimationConfig(animationsDisabled.value),
            },
          },
          globalOptions: rippleGlobalOptions,
        },
        'dom',
      ),
    ),
    'dom',
  );
}

/**
 * Whether `host` has received a ripple-initializing event, recorded synchronously at event time by
 * the delegate (an expando, never a DOM attribute). Use this when the answer must respect real
 * event order — e.g. upstream `setDisabled()`'s "was the ripple created before the disabled
 * change" branch.
 */
export function wasRippleInitialized(host: Element | undefined): boolean {
  return !!(host as unknown as Record<string, boolean> | undefined)?.[
    '__matRippleLoaderInitialized'
  ];
}
