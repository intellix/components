/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * Tracks "was a real keydown observed since the last focus change" AND
 * "what pointer modality (mouse/touch) most recently pressed down" for
 * `useFocusOrigin()` (./focus-origin.ts), via plain, synchronous DOM event
 * handlers rather than any Qwik-managed (lazy) listener for either.
 *
 * State lives on `window`, not a module-level `let`: Qwik's build splits
 * each `$()`-wrapped callback (and the module-level code living alongside
 * it) into its own output chunk per entry point
 * (`qwik-cdk/vite.config.ts`'s `entries`), and nothing guarantees the SAME
 * module instance — rather than independent bundled copies — is shared
 * between, say, `qwik-cdk`'s root entry (`<QwikCdkRoot>`, which installs
 * the primary listeners — an inline `<script>`, see its own comment) and
 * `qwik-cdk/a11y`'s entry (`useFocusOrigin()`, which reads/clears them).
 * `window` is unambiguously the one shared realm regardless of how many
 * separate module copies exist.
 *
 * No time-based expiry (unlike, say, `InputModalityDetector`'s
 * `TOUCH_BUFFER_MS`, or upstream `FocusMonitor`'s own 1ms "IMMEDIATE mode"
 * clear): each flag persists until the NEXT `focusin` actually consumes it
 * (`consumeRecentKeydown()`) or a NEWER `pointerdown` invalidates the
 * keydown one (mirrors upstream's single shared `origin` variable, where
 * the latest interaction simply overwrites whatever was there before). A
 * short timer (confirmed live, originally 1ms, mirroring upstream's own
 * IMMEDIATE mode) does NOT work here: unlike upstream, these flags aren't
 * read synchronously by the SAME listener that set them —
 * `useFocusOrigin()`'s `focusin` handler is a lazily-resolved Qwik QRL (at
 * least one microtask, even for an already-cached chunk) reading them from
 * a DIFFERENT handler entirely, and that resolution routinely took longer
 * than 1ms under real test-harness load, making a flag read back cleared
 * by the time anything checked it (see `qwik-material/tooltip`'s `basic`
 * scenario).
 *
 * The pointer-modality flag (NOT just the keydown one) ALSO needs this
 * eager, synchronous treatment as of the Qwik v2 upgrade — not only
 * `document.onkeydown`, originally the sole listener here. Under v2, every
 * Qwik event handler resolves through a microtask-deferred `import()` even
 * when already cached, and `useFocusOrigin()`'s own (lazy) `pointerdown`
 * and `focusin` handlers are two DIFFERENT QRLs — so their relative
 * resolution order is no longer guaranteed to match the browser's real
 * `pointerdown`-then-`focusin` dispatch order for the SAME gesture.
 * Confirmed live: a real click immediately following a keyboard selection
 * (e.g. pressing Space then clicking a different tab) got attributed
 * `cdk-program-focused` instead of `cdk-mouse-focused` once the keydown
 * race above was fixed — the `focusin` handler's "which pointer modality"
 * read was STILL racing its own click's `pointerdown` handler, which is
 * what would otherwise have recorded 'mouse'. Moving BOTH flags to this
 * same eager, zero-QRL-resolution layer makes a real `pointerdown` always
 * win against its own later `focusin`, since it unconditionally precedes
 * it in actual browser dispatch.
 */

const KEYDOWN_FLAG_KEY = '__qwikCdkRecentKeydown__';
const POINTER_MODALITY_FLAG_KEY = '__qwikCdkRecentPointerModality__';

type PointerModality = 'mouse' | 'touch' | null;

interface RecentInteractionWindow {
  [KEYDOWN_FLAG_KEY]?: boolean;
  // The RAW `PointerEvent.pointerType` string ("mouse"/"touch"/"pen"/...),
  // not yet mapped to `PointerModality` — see `getRecentPointerModality()`.
  // `<QwikCdkRoot>`'s inline script stores this verbatim specifically so
  // it never needs a quoted string literal of its own (its own doc
  // comment explains why quotes there are unsafe).
  [POINTER_MODALITY_FLAG_KEY]?: string | null;
}

/** Whether a real `keydown` has fired since the last `focusin` consumed it. */
export function wasRecentKeydown(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as RecentInteractionWindow)[KEYDOWN_FLAG_KEY];
}

/** Clears the flag — called once a `focusin` has used (or a `pointerdown` has invalidated) it. */
export function consumeRecentKeydown(): void {
  if (typeof window === 'undefined') return;
  (window as RecentInteractionWindow)[KEYDOWN_FLAG_KEY] = false;
}

/**
 * The modality of the most recent `pointerdown`, since the last `focusin`
 * consumed it — mirrors `event.pointerType === 'touch' ? 'touch' : 'mouse'`
 * (anything that isn't literally "touch", e.g. "mouse"/"pen", counts as
 * mouse), matching this hook's pre-v2 behavior exactly.
 */
export function getRecentPointerModality(): PointerModality {
  if (typeof window === 'undefined') return null;
  const raw = (window as RecentInteractionWindow)[POINTER_MODALITY_FLAG_KEY];
  if (!raw) return null;
  return raw === 'touch' ? 'touch' : 'mouse';
}

/** Clears the flag — called once a `focusin` has consumed it. */
export function consumeRecentPointerModality(): void {
  if (typeof window === 'undefined') return;
  (window as RecentInteractionWindow)[POINTER_MODALITY_FLAG_KEY] = null;
}
