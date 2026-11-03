import {$, createContextId, useContext} from '@qwik.dev/core';
import type {QRL} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {beginCopyToClipboard, copyToClipboard} from './clipboard';

/**
 * Object that can be used to configure the default options for `useCdkCopyToClipboard()`.
 * Mirrors upstream's `CdkCopyToClipboardConfig` + `CDK_COPY_TO_CLIPBOARD_CONFIG`
 * `InjectionToken`.
 */
export interface CdkCopyToClipboardConfig {
  /** Default number of attempts to make when copying text to the clipboard. */
  attempts?: number;
}

/** Qwik context carrying the default `CdkCopyToClipboardConfig` for `useCdkCopyToClipboard()`. */
export const CDK_COPY_TO_CLIPBOARD_CONFIG = createContextId<CdkCopyToClipboardConfig>(
  'qwikCdk/cdkCopyToClipboardConfig',
);

/**
 * Directive-hook form of upstream's `[cdkCopyToClipboard]` (`src/cdk/clipboard/
 * copy-to-clipboard.ts`'s `CdkCopyToClipboard`) — see `qwik-material/core/host-props.ts`'s
 * doc comment for the general pattern this follows (a hook returning what the real Angular
 * directive would have contributed to the consumer's own host element, instead of a
 * component owning its own host).
 *
 * ```tsx
 * const clip = useCdkCopyToClipboard({text: 'Hello world', attempts: 3});
 * return <button {...clip.hostProps}>Copy</button>;
 * ```
 */
export interface UseCdkCopyToClipboardProps {
  /** Content to copy. Mirrors `[cdkCopyToClipboard]`. */
  text: string;
  /**
   * How many times to attempt to copy the text. This may be necessary for longer text, because
   * the browser needs time to fill an intermediate textarea element and copy the content.
   * Falls back to `CDK_COPY_TO_CLIPBOARD_CONFIG`, then `1`.
   */
  attempts?: number;
  /** Fires once copying is done. The value indicates whether copying was successful.
   *  Mirrors `(cdkCopyToClipboardCopied)`. */
  onCopied$?: QRL<(successful: boolean) => void>;
}

/**
 * What this hook contributes to the eventual host element — just the click handler, the
 * only thing upstream's `[cdkCopyToClipboard]` host binding sets. Structurally compatible
 * with `qwik-material/core/host-props.ts`'s `HostProps` (that module isn't imported here —
 * qwik-material depends on qwik-cdk, not the other way around — but its `HostProps` is an
 * all-optional-fields-plus-index-signature interface, so a plain `{onClick$}` object already
 * satisfies it structurally for `mergeHostProps()`/a direct spread).
 */
export interface CdkCopyToClipboardHostProps {
  onClick$: QRL<() => void>;
  [key: string]: unknown;
}

export interface CdkCopyToClipboardHook {
  /** Spread onto the element that should trigger the copy on click. */
  hostProps: CdkCopyToClipboardHostProps;
  /** Triggers the copy programmatically (same logic `hostProps.onClick$` runs). */
  copy: QRL<(attempts?: number) => void>;
}

export function useCdkCopyToClipboard(props: UseCdkCopyToClipboardProps): CdkCopyToClipboardHook {
  // Type-annotated so the result is `CdkCopyToClipboardConfig`, not the (property-access-
  // hostile) `CdkCopyToClipboardConfig | {}` union `useContext()`'s second overload would
  // otherwise infer from the bare `{}` default literal — same fix `useMatTooltip()` uses
  // (coercing through `resolveConfig()`'s own parameter annotation instead) for the
  // identical `useContext(ID, {})` pattern.
  const config: CdkCopyToClipboardConfig = useContext(CDK_COPY_TO_CLIPBOARD_CONFIG, {});

  const copy = $((attempts?: number) => {
    if (!isBrowser) return;
    const effectiveAttempts = attempts ?? props.attempts ?? config.attempts ?? 1;
    runCopyAttempts(props.text, effectiveAttempts, successful => props.onCopied$?.(successful));
  });

  return {
    copy,
    hostProps: {
      onClick$: $(() => copy()),
    },
  };
}

/**
 * Runs the (possibly multi-attempt) copy loop — ported from upstream `CdkCopyToClipboard.copy()`.
 * A plain module function (not a `$()` closure) so it can be shared by both the hook's
 * `copy` QRL and, e.g., a future non-hook caller without duplicating the retry logic.
 */
function runCopyAttempts(
  text: string,
  attempts: number,
  onDone: (successful: boolean) => void,
): void {
  if (attempts > 1) {
    let remainingAttempts = attempts;
    const pending = beginCopyToClipboard(text);
    const attempt = () => {
      const successful = pending.copy();
      if (!successful && --remainingAttempts) {
        // Upstream uses 1ms since it's more predictable when flushing in unit tests.
        setTimeout(attempt, 1);
      } else {
        pending.destroy();
        onDone(successful);
      }
    };
    attempt();
  } else {
    onDone(copyToClipboard(text));
  }
}
