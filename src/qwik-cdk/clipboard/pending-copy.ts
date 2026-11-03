import {isBrowser} from '@qwik.dev/core/build';

/**
 * A pending copy-to-clipboard operation.
 *
 * The implementation of copying text to the clipboard modifies the DOM and
 * forces a re-layout. This re-layout can take too long if the string is large,
 * causing the execCommand('copy') to happen too long after the user clicked.
 * This results in the browser refusing to copy. This object lets the
 * re-layout happen in a separate tick from copying by providing a copy function
 * that can be called later.
 *
 * `destroy()` must be called when no longer in use, regardless of whether `copy()` is
 * called.
 */
export interface PendingCopy {
  /** Finishes copying the text. Returns whether the copy succeeded. */
  copy(): boolean;
  /** Cleans up DOM changes used to perform the copy operation. */
  destroy(): void;
}

/**
 * Port of `src/cdk/clipboard/pending-copy.ts`'s `PendingCopy` class. A plain factory (object
 * literal + closures) instead of a `class` — same convention as `createFocusTrap` elsewhere
 * in this package. SSR-safe: returns a no-op (`copy()` always `false`) when called outside
 * the browser, since a server has no document selection/`execCommand` to speak of — upstream
 * never runs this path during SSR either (only ever constructed by `Clipboard.beginCopy()`,
 * itself only ever called from a click handler).
 */
export function createPendingCopy(text: string, doc: Document = document): PendingCopy {
  if (!isBrowser) {
    return {copy: () => false, destroy: () => {}};
  }

  // ssr-leak-ok: isBrowser-guarded above; `doc` defaults to the global `document` but a
  // caller may pass their own, so this function itself never references the bare global.
  let textarea: HTMLTextAreaElement | undefined = doc.createElement('textarea');
  const styles = textarea.style;

  // Hide the element for display and accessibility. Set a fixed position so the page layout
  // isn't affected. We use `fixed` with `top: 0`, because focus is moved into the textarea
  // for a split second and if it's off-screen, some browsers will attempt to scroll it into view.
  styles.position = 'fixed';
  styles.top = styles.opacity = '0';
  styles.left = '-999em';
  textarea.setAttribute('aria-hidden', 'true');
  textarea.value = text;
  // Making the textarea `readonly` prevents the screen from jumping on iOS Safari (see angular/components#25169).
  textarea.readOnly = true;
  // The element needs to be inserted into the fullscreen container, if the page
  // is in fullscreen mode, otherwise the browser won't execute the copy command.
  (doc.fullscreenElement || doc.body).appendChild(textarea);

  return {
    copy() {
      let successful = false;

      try {
        // Older browsers could throw if copy is not supported.
        if (textarea) {
          const currentFocus = doc.activeElement as HTMLElement | null;

          textarea.select();
          textarea.setSelectionRange(0, textarea.value.length);
          successful = doc.execCommand('copy');

          if (currentFocus) {
            currentFocus.focus();
          }
        }
      } catch {
        // Discard error. `successful`'s initial `false` already represents failure here.
      }

      return successful;
    },

    destroy() {
      if (textarea) {
        textarea.remove();
        textarea = undefined;
      }
    },
  };
}
