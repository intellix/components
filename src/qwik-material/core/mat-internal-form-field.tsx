import {component$, Slot} from '@builder.io/qwik';

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
    <div {...{'mat-internal-form-field': ''}} class={classes}>
      <Slot />
    </div>
  );
});
