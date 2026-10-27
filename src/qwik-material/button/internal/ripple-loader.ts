import {type Signal, useVisibleTask$} from '@builder.io/qwik';

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

const UNINITIALIZED_ATTR = 'mat-ripple-loader-uninitialized';
const CLASS_NAME_ATTR = 'mat-ripple-loader-class-name';
const CENTERED_ATTR = 'mat-ripple-loader-centered';
const DISABLED_ATTR = 'mat-ripple-loader-disabled';

/**
 * SSR-rendered host attributes equivalent to upstream's
 * `MatRippleLoader.configureRipple()` call. Spread onto the same host
 * element that `useRippleLoader` attaches to.
 */
export function rippleLoaderHostAttrs(config: RippleLoaderConfig): Record<string, string> {
  const attrs: Record<string, string> = {
    [UNINITIALIZED_ATTR]: '',
    [CLASS_NAME_ATTR]: config.className,
  };
  if (config.centered) attrs[CENTERED_ATTR] = '';
  if (config.disabled) attrs[DISABLED_ATTR] = '';
  return attrs;
}

const RIPPLE_INTERACTION_EVENTS = ['focus', 'mousedown', 'mouseenter', 'touchstart'] as const;

/**
 * Client-side half of the ripple-loader contract: on the first interaction
 * event, removes `mat-ripple-loader-uninitialized` and appends the
 * `<span class="mat-ripple …">` that upstream's `_createRipple` inserts as
 * the host's last child.
 */
export function useRippleLoader(hostRef: Signal<Element | undefined>): void {
  useVisibleTask$(({cleanup}) => {
    const host = hostRef.value;
    if (!host) return;

    const createRipple = () => {
      if (!host.hasAttribute(UNINITIALIZED_ATTR)) return;
      host.querySelector(':scope > .mat-ripple')?.remove();
      const rippleEl = host.ownerDocument.createElement('span');
      rippleEl.classList.add('mat-ripple');
      const extraClass = host.getAttribute(CLASS_NAME_ATTR);
      if (extraClass) rippleEl.classList.add(extraClass);
      host.append(rippleEl);
      host.removeAttribute(UNINITIALIZED_ATTR);
    };

    for (const type of RIPPLE_INTERACTION_EVENTS) {
      host.addEventListener(type, createRipple, {capture: true, passive: true});
    }

    cleanup(() => {
      for (const type of RIPPLE_INTERACTION_EVENTS) {
        host.removeEventListener(type, createRipple, {capture: true});
      }
    });
  });
}
