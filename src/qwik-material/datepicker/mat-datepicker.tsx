/**
 * `<MatDatepicker>`/`<MatDateRangePicker>` — ported from upstream `datepicker.ts`/
 * `date-range-picker.ts`. Both are permanently-EMPTY-template hosts upstream (`template: ''`):
 * confirmed live, `<mat-datepicker>`/`<mat-date-range-picker>` render as literally empty tags
 * forever at their declaration site, landing inside `.mat-mdc-form-field-infix` as the LAST
 * child, directly after the native `<input>`/`<mat-date-range-input>` — the SAME slot the
 * control itself occupies (see `datepicker.ts`'s own EMPTY-HOST COMPONENTS note). Render these
 * via `<MatFormField infixContent={<MatDatepicker picker={picker} />}>` to land them there.
 *
 * `actions` mirrors nesting `<mat-datepicker-actions>`/`<mat-date-range-picker-actions>` CHILDREN
 * inside the Angular template's `<mat-datepicker>#picker>...</mat-datepicker>` tags — upstream
 * never renders that content at the declaration site either (no `<ng-content>` on an empty
 * template); it only exists as a `ContentChild`-queried component that calls `registerActions()`
 * on its injected `MatDatepickerBase`, landing its OWN separately-templated content as a
 * `TemplatePortal` inside the OPEN overlay's `<mat-datepicker-content>` (see
 * `datepicker.ts`'s ACTIONS note). This port collapses that indirection: `actions` is just a
 * named prop, stashed onto the shared `picker` handle (as a `Signal`, so the JSX — which carries
 * real `$()` event handlers — survives the SSR→resume boundary the same proven way
 * `mat-form-field.tsx`'s own `controlSnapshot` does) and read later by `datepicker-runtime.ts`'s
 * `openDatepickerPanel`/`openDateRangePickerPanel`, which hands it to `MatDatepickerContent` to
 * render in the right place. There is no separate `MatDatepickerActions`/`MatDatepickerCancel`/
 * `MatDatepickerApply` component in this port — the consumer writes a plain `<div class=
 * "mat-datepicker-actions">` (matching `datepicker-actions.scss`'s own selector) containing
 * ordinary `<MatButton onClick$={$(() => applyDatepickerSelection(picker))}>` elements, calling
 * `applyDatepickerSelection`/`cancelDatepickerSelection` (or the range variants) directly — see
 * `SYNC.md`'s usage example.
 *
 * `_actionsContent.value` is written UNCONDITIONALLY, every render — deliberately never guarded
 * by first reading it back (`if (picker._actionsContent.value !== props.actions) ...` was tried
 * first). Confirmed live (`actions`'s own Apply click) that the guard's READ, combined with the
 * write, hits design-doc rule 2 ("never read and write the same signal during render"): the
 * ROUTE's `value`/`range` signal changing (from `onValueChange$`, fired by Apply) re-renders the
 * WHOLE route, rebuilding BOTH `<MatFormField>` trees with a brand-new `<MatDatepicker
 * actions={...}>` JSX reference each time (plain JSX, never frozen in a `useSignal` the way
 * `mat-form-field.tsx`'s own `controlSnapshot` freezes `control`) — so the guard's condition was
 * true on EVERY one of those re-renders, not just the first. With the read removed, this is a
 * plain, unconditional, write-only signal update — the same safe shape `_formFieldOrigin`'s own
 * plain-field assignment already establishes, just via a `Signal` instead of a bare field (see
 * `use-mat-datepicker.ts`'s `_actionsContent` doc comment for why a `Signal` is still needed
 * here, unlike `_formFieldOrigin`).
 */
import {component$, type JSXOutput} from '@builder.io/qwik';
import type {MatDatepickerHandle, MatDateRangePickerHandle} from './use-mat-datepicker';

export interface MatDatepickerProps<D = unknown> {
  picker: MatDatepickerHandle<D>;
  /** See this file's own doc comment — mirrors a nested `<mat-datepicker-actions>` child. */
  actions?: JSXOutput;
}

export const MatDatepicker = component$<MatDatepickerProps>(props => {
  props.picker._actionsContent.value = props.actions;
  return <mat-datepicker />;
});

export interface MatDateRangePickerProps<D = unknown> {
  picker: MatDateRangePickerHandle<D>;
  /** See this file's own doc comment — mirrors a nested `<mat-date-range-picker-actions>` child. */
  actions?: JSXOutput;
}

export const MatDateRangePicker = component$<MatDateRangePickerProps>(props => {
  props.picker._actionsContent.value = props.actions;
  return <mat-date-range-picker />;
});
