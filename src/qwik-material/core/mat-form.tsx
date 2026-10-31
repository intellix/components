import {
  $,
  component$,
  createContextId,
  Slot,
  useContext,
  useContextProvider,
  useStore,
  type ClassList,
  type QRL,
} from '@builder.io/qwik';

/** Submission state of the nearest enclosing {@link MatForm}. */
export interface MatFormState {
  submitted: boolean;
}

export const MAT_FORM = createContextId<MatFormState>('qwik-material/form');

const NO_FORM: MatFormState = {submitted: false};

/**
 * Whether the nearest enclosing {@link MatForm} has been submitted (`false` outside one). Part
 * of upstream's default `ErrorStateMatcher`: `control.invalid && (control.touched ||
 * form.submitted)`. Reactive when read during render.
 */
export function useMatFormSubmitted(): boolean {
  return useContext(MAT_FORM, NO_FORM).submitted;
}

export interface MatFormProps {
  class?: ClassList;
  noValidate?: boolean;
  /** Called after the form is marked submitted. The native submit is always prevented. */
  onSubmit$?: QRL<(event: SubmitEvent) => void>;
}

/**
 * The `<form [formGroup]>` / `<form ngForm>` half of Angular forms that Material reads: marks
 * the form submitted on submit (adding `ng-submitted`, like `NgControlStatusGroup`), prevents
 * the native submission (like `FormGroupDirective.onSubmit` returning `false`), and lets the
 * Material controls inside show their error state once submitted, as upstream's default
 * `ErrorStateMatcher` does. Validity classes (`ng-valid`/`ng-invalid`, ...) stay the consumer's,
 * via `class`.
 */
export const MatForm = component$<MatFormProps>(props => {
  const state = useStore<MatFormState>({submitted: false});
  useContextProvider(MAT_FORM, state);

  const onSubmit$ = $((event: SubmitEvent) => {
    state.submitted = true;
    return props.onSubmit$?.(event);
  });

  return (
    <form
      noValidate={props.noValidate}
      class={[props.class, state.submitted && 'ng-submitted']}
      preventdefault:submit
      onSubmit$={onSubmit$}
    >
      <Slot />
    </form>
  );
});
