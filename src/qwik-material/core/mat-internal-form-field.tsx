import {component$, Slot, type QRL} from '@qwik.dev/core';

/**
 * Props for <MatInternalFormField>. Mirrors upstream's `_MatInternalFormField`
 * (`src/material/core/internal-form-field/internal-form-field.ts`), the
 * `div[mat-internal-form-field]` container that checkbox, radio and
 * slide-toggle wrap their control + label in.
 */
export interface MatInternalFormFieldProps {
  /** Position of the label relative to the content. Default 'after'. */
  labelPosition?: 'before' | 'after';
  class?: string | ReadonlyArray<string>;
  /**
   * Optional click handler attached to the rendered div. `_MatInternalFormField`
   * is itself a bare directive/component with no click handling of its own —
   * this exists so a consumer (e.g. checkbox.html's
   * `(click)="_preventBubblingFromLabel($event)"`) can attach ITS OWN click
   * listener to the same host element the `mat-internal-form-field` selector
   * lands on, exactly as Angular lets a template bind both a component
   * selector and a plain event on one element.
   */
  onClick$?: QRL<(event: Event) => void>;
  /**
   * Optional pointer-event handlers attached to the rendered div. Needed by
   * `qwik-material/radio`: upstream's `radio.html` takes `#formField` (this
   * SAME `mat-internal-form-field` div, a template reference variable on
   * the component selector itself — Angular allows both on one element) as
   * `[matRippleTrigger]`, i.e. the ripple's pointer-event trigger is the
   * WHOLE form field (control + label), not just the `.mdc-radio` control —
   * confirmed by upstream's template, clicking the label also launches a
   * ripple. No other current caller needs these (checkbox/slide-toggle's
   * own ripple triggers are elements they render directly). All six should
   * be wired to the SAME `$()` reference by the caller — see
   * `core/ripple/ripple-renderer.ts`'s module doc comment for why.
   */
  onMouseDown$?: QRL<(event: MouseEvent, element: Element) => void>;
  onMouseUp$?: QRL<(event: MouseEvent, element: Element) => void>;
  onMouseLeave$?: QRL<(event: MouseEvent, element: Element) => void>;
  onTouchStart$?: QRL<(event: TouchEvent, element: Element) => void>;
  onTouchEnd$?: QRL<(event: TouchEvent, element: Element) => void>;
  onTouchCancel$?: QRL<(event: TouchEvent, element: Element) => void>;
}

export const MatInternalFormField = component$<MatInternalFormFieldProps>(props => {
  const classes = [
    'mdc-form-field',
    'mat-internal-form-field',
    props.labelPosition === 'before' && 'mdc-form-field--align-end',
    ...(typeof props.class === 'string' ? [props.class] : (props.class ?? [])),
  ].filter(Boolean) as string[];

  // `mat-internal-form-field` is the selector attribute upstream's own
  // templates write, so it is part of the rendered DOM.
  return (
    <div
      {...{'mat-internal-form-field': ''}}
      class={classes}
      onClick$={props.onClick$}
      onMouseDown$={props.onMouseDown$}
      onMouseUp$={props.onMouseUp$}
      onMouseLeave$={props.onMouseLeave$}
      onTouchStart$={props.onTouchStart$}
      onTouchEnd$={props.onTouchEnd$}
      onTouchCancel$={props.onTouchCancel$}
    >
      <Slot />
    </div>
  );
});
