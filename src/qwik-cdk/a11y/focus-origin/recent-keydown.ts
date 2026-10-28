/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * Tracks "was a real keydown observed since the last focus change" for
 * `useFocusOrigin()` (./focus-origin.ts), via a plain, synchronous DOM
 * event handler rather than any Qwik-managed (lazy) listener.
 *
 * State lives on `window`, not a module-level `let`: Qwik's build splits
 * each `$()`-wrapped callback (and the module-level code living alongside
 * it) into its own output chunk per entry point
 * (`qwik-cdk/vite.config.ts`'s `entries`), and nothing guarantees the SAME
 * module instance — rather than independent bundled copies — is shared
 * between, say, `qwik-cdk`'s root entry (`<QwikCdkRoot>`, which installs
 * the primary listener — an inline `<script>`, see its own comment) and
 * `qwik-cdk/a11y`'s entry (`useFocusOrigin()`, which reads/clears it).
 * `window` is unambiguously the one shared realm regardless of how many
 * separate module copies exist.
 *
 * No time-based expiry (unlike, say, `InputModalityDetector`'s
 * `TOUCH_BUFFER_MS`, or upstream `FocusMonitor`'s own 1ms "IMMEDIATE mode"
 * clear): the flag persists until the NEXT `focusin` actually consumes it
 * (`consumeRecentKeydown()`) or a NEWER `pointerdown` invalidates it
 * (mirrors upstream's single shared `origin` variable, where the latest
 * interaction simply overwrites whatever was there before). A short timer
 * (confirmed live, originally 1ms, mirroring upstream's own IMMEDIATE
 * mode) does NOT work here: unlike upstream, this flag isn't read
 * synchronously by the SAME listener that set it — `useFocusOrigin()`'s
 * `focusin` handler is a lazily-resolved Qwik QRL (at least one microtask,
 * even for an already-cached chunk) reading it from a DIFFERENT handler
 * entirely, and that resolution routinely took longer than 1ms under real
 * test-harness load, making the flag read back `false` by the time
 * anything checked it (see `qwik-material/tooltip`'s `basic` scenario).
 */

const FLAG_KEY = '__qwikCdkRecentKeydown__';

interface RecentKeydownWindow {
  [FLAG_KEY]?: boolean;
}

/** Whether a real `keydown` has fired since the last `focusin` consumed it. */
export function wasRecentKeydown(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as RecentKeydownWindow)[FLAG_KEY];
}

/** Clears the flag — called once a `focusin` has used (or a `pointerdown` has invalidated) it. */
export function consumeRecentKeydown(): void {
  if (typeof window === 'undefined') return;
  (window as RecentKeydownWindow)[FLAG_KEY] = false;
}
