import type {Platform} from '../platform/platform';

/** Classes/attributes this engine applies — exported for callers that need the exact
 *  strings (e.g. a host-props bag), matching upstream's `_text-field.scss` selectors. */
export const AUTOSIZE_CLASS = 'cdk-textarea-autosize';
const MEASURING_CLASS = 'cdk-textarea-autosize-measuring';
const MEASURING_CLASS_FIREFOX = 'cdk-textarea-autosize-measuring-firefox';

/**
 * Port of `src/cdk/text-field/autosize.ts`'s `CdkTextareaAutosize` directive — the
 * measuring/resizing ALGORITHM only, with no DOM-event wiring (that lives in
 * `use-cdk-textarea-autosize.ts`, this port's Qwik hook). A plain `createTextareaAutosize()`
 * factory (object literal + closures), same convention as `createFocusTrap` in
 * `qwik-cdk/a11y` — and, like that factory, deliberately NOT safe to store inside a
 * `useSignal`/`useStore` (see `qwik-cdk/collections/data-source.ts`'s doc comment on the
 * general pitfall); construct one fresh wherever it's needed.
 */
export interface TextareaAutosize {
  /** Minimum amount of rows in the textarea. */
  minRows: number;
  /** Maximum amount of rows in the textarea. */
  maxRows: number;
  /** Whether autosizing is enabled. Setting this to `true` immediately resizes; `false` resets. */
  enabled: boolean;
  /** Call on every `focus`/`blur` of the textarea — affects the margin-filler workaround
   *  `resizeToFitContent()` uses while measuring (upstream: `_hasFocus`). */
  setHasFocus(hasFocus: boolean): void;
  /** Resize the textarea to fit its content.
   *  @param force Whether to force a height recalculation even if the value/minRows haven't
   *  changed since the last call. */
  resizeToFitContent(force?: boolean): void;
  /** Resets the textarea to the height it had when this engine was created. */
  reset(): void;
  /** Call when `placeholder` changes — invalidates the cached placeholder height. */
  notePlaceholderChanged(): void;
}

export interface CreateTextareaAutosizeOptions {
  minRows?: number;
  maxRows?: number;
  platform?: Platform;
}

export function createTextareaAutosize(
  textarea: HTMLTextAreaElement,
  options: CreateTextareaAutosizeOptions = {},
): TextareaAutosize {
  const isFirefox = !!options.platform?.FIREFOX;

  let minRows = options.minRows ?? 0;
  let maxRows = options.maxRows ?? 0;
  let enabled = true;
  let hasFocus = false;

  let previousValue: string | undefined;
  let previousMinRows = -1;
  let cachedLineHeight: number | undefined;
  let cachedPlaceholderHeight: number | undefined;
  const initialHeight = textarea.style.height;

  function setMinHeight(): void {
    const minHeight = minRows && cachedLineHeight ? `${minRows * cachedLineHeight}px` : null;
    if (minHeight) textarea.style.minHeight = minHeight;
  }

  function setMaxHeight(): void {
    const maxHeight = maxRows && cachedLineHeight ? `${maxRows * cachedLineHeight}px` : null;
    if (maxHeight) textarea.style.maxHeight = maxHeight;
  }

  /**
   * Caches the height of a single-row textarea if it has not already been cached.
   * We need to know how large a single "row" is in order to apply minRows/maxRows.
   */
  function cacheTextareaLineHeight(): void {
    if (cachedLineHeight) return;

    // Use a clone element because we have to override some styles.
    const clone = textarea.cloneNode(false) as HTMLTextAreaElement;
    const cloneStyles = clone.style;
    clone.rows = 1;

    // Use `position: absolute` so this doesn't cause a browser layout, and
    // `visibility: hidden` so nothing is rendered. Clear other styles that would affect height.
    cloneStyles.position = 'absolute';
    cloneStyles.visibility = 'hidden';
    cloneStyles.border = 'none';
    cloneStyles.padding = '0';
    cloneStyles.height = '';
    cloneStyles.minHeight = '';
    cloneStyles.maxHeight = '';
    cloneStyles.top = cloneStyles.bottom = cloneStyles.left = cloneStyles.right = 'auto';
    // Firefox adds extra space for a horizontal scrollbar even when there's no content;
    // hiding overflow removes it so the measurement isn't inflated.
    cloneStyles.overflow = 'hidden';

    textarea.parentNode?.appendChild(clone);
    cachedLineHeight = clone.clientHeight;
    clone.remove();

    // Min and max heights have to be re-calculated if the cached line height changes.
    setMinHeight();
    setMaxHeight();
  }

  function measureScrollHeight(): number {
    const previousMargin = textarea.style.marginBottom || '';
    const needsMarginFiller = hasFocus;
    const measuringClass = isFirefox ? MEASURING_CLASS_FIREFOX : MEASURING_CLASS;

    // The page might move around while measuring; a temporary margin the same height as the
    // textarea keeps it occupying the same space (angular/components#23233, #23834).
    if (needsMarginFiller) {
      textarea.style.marginBottom = `${textarea.clientHeight}px`;
    }

    // Reset to auto to shrink back to the default size, with overflow hidden so scrollbars
    // don't interfere. The measuring class includes 2px top/bottom padding to work around a
    // Chrome measurement bug, so subtract that back off (4 = 2px top + 2px bottom).
    textarea.classList.add(measuringClass);
    const scrollHeight = textarea.scrollHeight - 4;
    textarea.classList.remove(measuringClass);

    if (needsMarginFiller) {
      textarea.style.marginBottom = previousMargin;
    }

    return scrollHeight;
  }

  function cacheTextareaPlaceholderHeight(): void {
    if (cachedPlaceholderHeight != undefined) return;
    if (!textarea.placeholder) {
      cachedPlaceholderHeight = 0;
      return;
    }

    const value = textarea.value;
    textarea.value = textarea.placeholder;
    cachedPlaceholderHeight = measureScrollHeight();
    textarea.value = value;
  }

  /**
   * Scrolls the textarea to the caret position. On Firefox, resizing the textarea prevents it
   * from scrolling to the caret position, so the selection is re-set to force it.
   */
  function scrollToCaretPosition(): void {
    const {selectionStart, selectionEnd} = textarea;
    if (hasFocus) {
      textarea.setSelectionRange(selectionStart, selectionEnd);
    }
  }

  const engine: TextareaAutosize = {
    get minRows() {
      return minRows;
    },
    set minRows(value) {
      minRows = value;
      setMinHeight();
    },
    get maxRows() {
      return maxRows;
    },
    set maxRows(value) {
      maxRows = value;
      setMaxHeight();
    },
    get enabled() {
      return enabled;
    },
    set enabled(value) {
      // Only act if the value actually changed — mirrors upstream, which avoids running
      // `resizeToFitContent` too early (before the first real measurement).
      if (enabled !== value) {
        enabled = value;
        if (value) engine.resizeToFitContent(true);
        else engine.reset();
      }
    },

    setHasFocus(value) {
      hasFocus = value;
    },

    resizeToFitContent(force = false) {
      if (!enabled) return;

      cacheTextareaLineHeight();
      cacheTextareaPlaceholderHeight();

      // If the line height hasn't been determined yet, the element is still hidden —
      // there's no point measuring its height.
      if (!cachedLineHeight) return;

      const value = textarea.value;

      // Only resize if the value or minRows changed since these calculations can be expensive.
      if (!force && minRows === previousMinRows && value === previousValue) return;

      const scrollHeight = measureScrollHeight();
      const height = Math.max(scrollHeight, cachedPlaceholderHeight || 0);

      // Use scrollHeight to know how large the textarea *would* be if it fit its entire value.
      textarea.style.height = `${height}px`;

      // This engine has no `isBrowser` import of its own — it's environment-agnostic by
      // feature-detection instead (same guard upstream itself uses), and every real caller
      // only ever constructs/calls it from `use-cdk-textarea-autosize.ts`'s
      // `useVisibleTask$`, which never runs during SSR regardless.
      const run = () => scrollToCaretPosition();
      if (typeof requestAnimationFrame !== 'undefined') {
        // ssr-leak-ok: feature-detected on the line above.
        requestAnimationFrame(run);
      } else {
        setTimeout(run);
      }

      previousValue = value;
      previousMinRows = minRows;
    },

    reset() {
      // Don't touch the textarea if the initial height hasn't been determined yet — this
      // might otherwise remove styles when `reset()` is called before the first measurement.
      if (initialHeight !== undefined) {
        textarea.style.height = initialHeight;
      }
    },

    notePlaceholderChanged() {
      cachedPlaceholderHeight = undefined;
      cacheTextareaPlaceholderHeight();
    },
  };

  return engine;
}
