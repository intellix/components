import {useSignal, useVisibleTask$, type Signal} from '@qwik.dev/core';
import {createAutofillMonitor} from './autofill-monitor';

/** Static marker class upstream adds unconditionally, browser-only, the moment monitoring
 *  starts. Exported so a host component (e.g. `qwik-material/input`'s `MatInput`) can keep
 *  rendering it unconditionally, even without using this hook — see that component's own
 *  deviation note for why it does that (no live detection behind it there) and
 *  `qwik-cdk/text-field/SYNC.md` for this hook's own (REAL, live) detection. */
export const CDK_TEXT_FIELD_AUTOFILL_MONITORED_CLASS = 'cdk-text-field-autofill-monitored';

export interface CdkAutofillHostProps {
  ref: Signal<Element | undefined>;
  class: string;
}

export interface CdkAutofillHook {
  /** Spread onto the element to monitor. */
  hostProps: CdkAutofillHostProps;
  /** Whether the element is currently autofilled. Live, reactive. */
  isAutofilled: Signal<boolean>;
}

/**
 * Qwik hook form of `[cdkAutofill]` (`src/cdk/text-field/autofill.ts`'s `CdkAutofill`
 * directive) — directive-hook shaped (see `qwik-material/core/host-props.ts`'s doc comment
 * for the general pattern). Spread `hostProps` onto any input-like element:
 *
 * ```tsx
 * const autofill = useCdkAutofill();
 * return <input {...autofill.hostProps} class={{'is-autofilled': autofill.isAutofilled.value}} />;
 * ```
 */
export function useCdkAutofill(): CdkAutofillHook {
  const elementRef = useSignal<Element | undefined>();
  const isAutofilled = useSignal(false);

  // Client-only — real autofill detection is inherently a live-browser-only concern (no
  // server equivalent exists for "did the browser's password manager just fill this in").
  useVisibleTask$(({cleanup}) => {
    const element = elementRef.value;
    if (!element) return;

    // Created fresh here rather than shared/stored — see `qwik-cdk/collections/
    // data-source.ts`'s doc comment for why an object-with-methods must never be captured
    // across the SSR→resume boundary; this task only ever runs client-side anyway, but
    // staying consistent with every other `createX` engine's usage in this package.
    const monitor = createAutofillMonitor();
    const unsubscribe = monitor.monitor(element, event => {
      isAutofilled.value = event.isAutofilled;
    });

    cleanup(() => {
      unsubscribe();
      monitor.stopMonitoring(element);
      monitor.destroy();
    });
  });

  return {
    isAutofilled,
    hostProps: {
      ref: elementRef,
      // Always present, even before the task above runs client-side — matches
      // `qwik-material/input`'s `MatInput`, which renders this class unconditionally for
      // SSR-parity reasons (see that component's SYNC.md deviation #3). Consistent here too:
      // SSR can't detect real autofill either way, so there's no "wrong" state this could be
      // hiding — it's purely upstream's own "autofill monitoring has started" marker.
      class: CDK_TEXT_FIELD_AUTOFILL_MONITORED_CLASS,
    },
  };
}
