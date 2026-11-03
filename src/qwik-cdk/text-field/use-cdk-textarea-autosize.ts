import {useSignal, useVisibleTask$, type Signal} from '@qwik.dev/core';
import {createPlatform} from '../platform/platform';
import {AUTOSIZE_CLASS, createTextareaAutosize} from './textarea-autosize';

/**
 * Qwik hook form of `[cdkTextareaAutosize]` (`src/cdk/text-field/autosize.ts`'s
 * `CdkTextareaAutosize`) — directive-hook shaped (see `qwik-material/core/host-props.ts`'s
 * doc comment for the general pattern): returns `hostProps` to spread onto EITHER a plain
 * `<textarea>` OR `qwik-material/input`'s `<MatInput as="textarea">` (its props already
 * happen to include every key this bag sets — `class`, `rows`, `ref` — so no change to
 * `MatInput` itself is needed; see `qwik-cdk/text-field/SYNC.md` for why this, rather than a
 * dedicated `autosize`/`autosizeMinRows` prop on `MatInput`, is the more Angular-faithful
 * integration: it mirrors upstream applying `cdkTextareaAutosize` and `matInput` as two
 * independent directives on the SAME host element. The actual resize-on-input/focus/blur/
 * window-resize wiring below uses plain `addEventListener` rather than a JSX `onInput$` host
 * prop, specifically so it composes with a consumer's own `onInput$`/etc. for free (a raw
 * native listener never competes with a Qwik JSX prop the way `useOn()` would — see this
 * package's top-level pitfalls list on `useOn()` replacing a same-named JSX-prop handler).
 *
 * ```tsx
 * const autosize = useCdkTextareaAutosize({minRows: 2, maxRows: 6});
 * return <textarea {...autosize.hostProps} />;
 * // or:
 * return <MatInput as="textarea" {...autosize.hostProps} />;
 * ```
 */
export interface UseCdkTextareaAutosizeOptions {
  /** Minimum amount of rows in the textarea. */
  minRows?: number;
  /** Maximum amount of rows in the textarea. */
  maxRows?: number;
}

export interface CdkTextareaAutosizeHostProps {
  ref: Signal<Element | undefined>;
  class: string;
  rows: number;
}

export interface CdkTextareaAutosizeHook {
  hostProps: CdkTextareaAutosizeHostProps;
  /** Whether autosizing is enabled. Setting to `false` resets the textarea to its original
   *  height (its value when this hook first ran); setting back to `true` immediately resizes. */
  enabled: Signal<boolean>;
  /** Bump (any new value, e.g. `resizeTrigger.value++`) to force a re-measurement — e.g.
   *  after setting the textarea's value programmatically (outside of a real `input` event). */
  resizeTrigger: Signal<number>;
}

export function useCdkTextareaAutosize(
  options: UseCdkTextareaAutosizeOptions = {},
): CdkTextareaAutosizeHook {
  const textareaRef = useSignal<Element | undefined>();
  const enabled = useSignal(true);
  const resizeTrigger = useSignal(0);

  // Client-only (mirrors upstream's `ngAfterViewInit`/`ngDoCheck`, both already gated by
  // `this._platform.isBrowser` — SSR never resizes either on the real side). Re-creates the
  // engine fresh on every run (initial mount, and whenever `enabled`/`resizeTrigger` change)
  // rather than trying to persist one across runs — see `qwik-cdk/collections/data-source.ts`'s
  // doc comment for why an object-with-methods must never be captured across the SSR→resume
  // boundary in the first place; recreating it is also simply how every other `createX`
  // engine in this package (`createFocusTrap`, etc.) is used from inside a task.
  useVisibleTask$(({track, cleanup}) => {
    const isEnabled = track(() => enabled.value);
    track(() => resizeTrigger.value);

    const textarea = textareaRef.value as HTMLTextAreaElement | undefined;
    if (!textarea) return;

    const engine = createTextareaAutosize(textarea, {
      minRows: options.minRows,
      maxRows: options.maxRows,
      platform: createPlatform(),
    });
    engine.minRows = options.minRows ?? 0;
    engine.maxRows = options.maxRows ?? 0;
    engine.enabled = isEnabled;
    // `engine.enabled`'s setter already no-ops when the value hasn't changed from its
    // (always-`true`) construction default, so the very first run needs an explicit kick to
    // actually measure once mounted.
    engine.resizeToFitContent(true);

    const handleFocus = () => engine.setHasFocus(true);
    const handleBlur = () => engine.setHasFocus(false);
    const handleInput = () => engine.resizeToFitContent();
    const handleWindowResize = () => engine.resizeToFitContent(true);

    textarea.addEventListener('focus', handleFocus);
    textarea.addEventListener('blur', handleBlur);
    textarea.addEventListener('input', handleInput);
    window.addEventListener('resize', handleWindowResize);

    cleanup(() => {
      textarea.removeEventListener('focus', handleFocus);
      textarea.removeEventListener('blur', handleBlur);
      textarea.removeEventListener('input', handleInput);
      window.removeEventListener('resize', handleWindowResize);
    });
  });

  return {
    enabled,
    resizeTrigger,
    hostProps: {
      ref: textareaRef,
      class: AUTOSIZE_CLASS,
      // Textarea elements that have the directive applied should have a single row by
      // default. Browsers normally show two rows by default, which would otherwise limit
      // the `minRows` binding — mirrors upstream's host binding exactly.
      rows: 1,
    },
  };
}
