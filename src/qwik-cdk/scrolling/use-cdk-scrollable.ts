import {useSignal, useVisibleTask$, type Signal} from '@qwik.dev/core';
import {getSharedScrollDispatcher} from './shared-instances';
import type {CdkScrollableHandle} from './scroll-dispatcher';

export interface CdkScrollableHostProps {
  ref: Signal<Element | undefined>;
}

export interface CdkScrollableHook {
  /** Spread onto the scrollable element. */
  hostProps: CdkScrollableHostProps;
  /** The live element, once mounted — pass to `scrollToElement()`/`measureScrollOffset()`
   *  (`qwik-cdk/scrolling/scrollable.ts`) from your own `$()` handler. */
  elementRef: Signal<Element | undefined>;
}

/**
 * Qwik hook form of `[cdkScrollable]`/`[cdk-scrollable]` (`src/cdk/scrolling/scrollable.ts`'s
 * `CdkScrollable` directive) — directive-hook shaped (see `qwik-material/core/
 * host-props.ts`'s doc comment for the general pattern). Spread `hostProps` onto any element
 * that should be tracked by the shared `ScrollDispatcher` (so `ancestorScrolled()` notices
 * scrolling inside it):
 *
 * ```tsx
 * const scrollable = useCdkScrollable();
 * return (
 *   <div {...scrollable.hostProps} style={{overflow: 'auto'}}>
 *     <button onClick$={() => scrollToElement(scrollable.elementRef.value as HTMLElement, {top: 0})}>
 *       Scroll to top
 *     </button>
 *   </div>
 * );
 * ```
 */
export function useCdkScrollable(): CdkScrollableHook {
  const elementRef = useSignal<Element | undefined>();

  // Client-only: registration only matters for live scroll-event routing, which has no SSR
  // equivalent anyway (see `shared-instances.ts`'s doc comment on why the dispatcher itself
  // is a plain module-level singleton rather than something threaded through context).
  useVisibleTask$(({cleanup}) => {
    const element = elementRef.value as HTMLElement | undefined;
    if (!element) return;

    const handle: CdkScrollableHandle = {
      element,
      elementScrolled(listener) {
        element.addEventListener('scroll', listener, {passive: true});
        return () => element.removeEventListener('scroll', listener);
      },
    };

    const deregister = getSharedScrollDispatcher().register(handle);
    cleanup(deregister);
  });

  return {
    elementRef,
    hostProps: {ref: elementRef},
  };
}
