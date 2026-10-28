import {isBrowser} from '@builder.io/qwik/build';

/**
 * Qwik port of `@angular/cdk/a11y`'s `LiveAnnouncer` (src/cdk/a11y/live-announcer/live-announcer.ts).
 *
 * Deviations from upstream:
 * - No Angular DI / `@Service()` — a plain factory. Consumers (e.g.
 *   `qwik-material/snack-bar`'s `useMatSnackBar()`) create and cache one
 *   themselves, the same pattern as every other qwik-cdk engine
 *   (`createFocusTrap`, `createOverlayKeyboardDispatcher`, ...).
 * - The live element is created LAZILY, on the first `announce()` call,
 *   rather than eagerly when the service is constructed/injected. Upstream's
 *   `LiveAnnouncer` creates its `<div class="cdk-live-announcer-element">`
 *   element in `document.body` the moment `inject(LiveAnnouncer)` runs
 *   (Angular DI has no lazy-construction story). Qwik has no eager
 *   construction moment that doesn't also mean "ship + run JS for every
 *   page that merely imports this module" (remediation rule 7 — lazy
 *   interaction plumbing); deferring to first real use means a page that
 *   never calls `announce()` never pays for the DOM node or its JS. Once
 *   created, the element is identical to upstream's (same classes/attrs),
 *   just later.
 * - `LiveAnnouncerMessage` (string | SafeHtml) narrowed to `string` — no
 *   Angular `DomSanitizer` / `SafeHtml` concept in Qwik.
 * - `CdkAriaLive` directive (the `[cdkAriaLive]` attribute directive) is not
 *   ported — out of scope for the snack-bar port that motivated this file.
 */

/** Possible politeness levels, mirroring upstream `AriaLivePoliteness`. */
export type AriaLivePoliteness = 'off' | 'polite' | 'assertive';

export interface LiveAnnouncer {
  /**
   * Announces a message to screen readers.
   * @param message Message to be announced.
   * @param politeness The politeness of the announcer element. Default 'polite'.
   * @param duration Time in milliseconds after which to clear the announcer element. Note
   *   that this takes effect after the message has been added to the DOM, which can be up to
   *   100ms after `announce` has been called.
   * @returns Promise that resolves once the message has been added to the DOM.
   */
  announce(message: string, politeness?: AriaLivePoliteness, duration?: number): Promise<void>;
  /** Clears the current text from the announcer element. */
  clear(): void;
  /** Removes the live element from the DOM and releases resources. */
  destroy(): void;
}

let uniqueIds = 0;

/**
 * Creates a `LiveAnnouncer`. Safe to call during SSR — the live element
 * itself is only ever created client-side (see `_createLiveElement` below),
 * so construction alone never touches `document`.
 */
export function createLiveAnnouncer(): LiveAnnouncer {
  let liveElement: HTMLElement | null = null;
  let previousTimeout: ReturnType<typeof setTimeout> | undefined;
  let currentPromise: Promise<void> | undefined;
  let currentResolve: (() => void) | undefined;

  function createLiveElement(): HTMLElement | null {
    if (!isBrowser) return null;
    // ssr-leak-ok: guarded by the `isBrowser` check above.
    const elementClass = 'cdk-live-announcer-element';
    const previousElements = document.getElementsByClassName(elementClass);
    const liveEl = document.createElement('div');

    // Remove any old containers. This can happen when coming in from a server-side-rendered page.
    for (let i = 0; i < previousElements.length; i++) {
      previousElements[i].remove();
    }

    liveEl.classList.add(elementClass);
    liveEl.classList.add('cdk-visually-hidden');
    liveEl.setAttribute('aria-atomic', 'true');
    liveEl.setAttribute('aria-live', 'polite');
    liveEl.id = `cdk-live-announcer-${uniqueIds++}`;
    document.body.appendChild(liveEl);
    return liveEl;
  }

  /**
   * Some browsers won't expose the accessibility node of the live announcer element if there is
   * an `aria-modal` and the live announcer is outside of it. Points the `aria-owns` of all modals
   * to the live announcer element — mirrors upstream `_exposeAnnouncerToModals`.
   */
  function exposeAnnouncerToModals(id: string): void {
    if (!isBrowser) return;
    // ssr-leak-ok: guarded by the `isBrowser` check above.
    const modals = document.querySelectorAll('body > .cdk-overlay-container [aria-modal="true"]');
    for (let i = 0; i < modals.length; i++) {
      const modal = modals[i];
      const ariaOwns = modal.getAttribute('aria-owns');
      if (!ariaOwns) {
        modal.setAttribute('aria-owns', id);
      } else if (ariaOwns.indexOf(id) === -1) {
        modal.setAttribute('aria-owns', ariaOwns + ' ' + id);
      }
    }
  }

  return {
    announce(message, politeness, duration) {
      if (!liveElement) liveElement = createLiveElement();
      if (!liveElement) return Promise.resolve();

      clearTimeout(previousTimeout);
      liveElement.textContent = '';

      const resolvedPoliteness = politeness ?? 'polite';
      liveElement.setAttribute('aria-live', resolvedPoliteness);
      if (liveElement.id) exposeAnnouncerToModals(liveElement.id);

      // This 100ms timeout is necessary for some browser + screen-reader combinations: both
      // JAWS and NVDA over IE11 will not announce anything without a non-zero timeout, and a
      // repeated (identical) message won't be read a second time without clearing then delaying.
      if (!currentPromise) {
        currentPromise = new Promise(resolve => (currentResolve = resolve));
      }

      const el = liveElement;
      previousTimeout = setTimeout(() => {
        el.textContent = message;

        if (typeof duration === 'number') {
          previousTimeout = setTimeout(() => {
            el.textContent = '';
          }, duration);
        }

        currentResolve?.();
        currentPromise = currentResolve = undefined;
      }, 100);

      return currentPromise;
    },

    clear() {
      if (liveElement) liveElement.textContent = '';
    },

    destroy() {
      clearTimeout(previousTimeout);
      liveElement?.remove();
      liveElement = null;
      currentResolve?.();
      currentPromise = currentResolve = undefined;
    },
  };
}
