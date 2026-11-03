import {createPendingCopy, type PendingCopy} from './pending-copy';

/**
 * Port of `src/cdk/clipboard/clipboard.ts`'s `Clipboard` service. Upstream is a trivial
 * `@Injectable({providedIn: 'root'})` wrapper around `PendingCopy` with no state of its own
 * — no Qwik DI needed, so this port is two plain functions instead of a service class.
 * Named `copyToClipboard`/`beginCopyToClipboard` rather than bare `copy`/`beginCopy` to avoid
 * shadowing the DOM's own global `Clipboard` interface/`navigator.clipboard` and to read
 * clearly at an import site (`import {copyToClipboard} from '@angular-community/qwik-cdk/clipboard'`).
 */

/**
 * Copies the provided text into the user's clipboard.
 * @param text The string to copy.
 * @param doc The document to use (defaults to the global `document`).
 * @returns Whether the operation was successful.
 */
export function copyToClipboard(text: string, doc?: Document): boolean {
  const pendingCopy = beginCopyToClipboard(text, doc);
  const successful = pendingCopy.copy();
  pendingCopy.destroy();
  return successful;
}

/**
 * Prepares a string to be copied later. This is useful for large strings
 * which take too long to successfully render and be copied in the same tick.
 *
 * The caller must call `destroy()` on the returned `PendingCopy`.
 *
 * @param text The string to copy.
 * @param doc The document to use (defaults to the global `document`).
 * @returns the pending copy operation.
 */
export function beginCopyToClipboard(text: string, doc: Document = document): PendingCopy {
  return createPendingCopy(text, doc);
}
