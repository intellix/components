import {
  $,
  component$,
  createContextId,
  Slot,
  useContext,
  useContextProvider,
  useStore,
  useTask$,
  type ClassList,
  type QRL,
} from '@qwik.dev/core';

/** Submission state of the nearest enclosing {@link MatForm}. */
export interface MatFormState {
  submitted: boolean;
}

export const MAT_FORM = createContextId<MatFormState>('qwikMaterial/form');

const NO_FORM: MatFormState = {submitted: false};

/**
 * The nearest enclosing {@link MatForm}'s state store itself (not just the unwrapped
 * `.submitted` boolean {@link useMatFormSubmitted} returns) — needed by anything that must
 * `track()` `submitted` LIVE from inside a `useTask$` (e.g. `core/error-state-matcher.ts`'s
 * consumers, resolving a custom `ErrorStateMatcher` QRL): `track()` only establishes a live
 * subscription when it reads a signal/store property DIRECTLY inside its own callback —
 * tracking a plain, already-dereferenced boolean captured in a closure (what
 * `useMatFormSubmitted()` returns) does not. Returns the `NO_FORM` fallback store (a plain,
 * literal object — already safe to serialize, unlike a `Symbol` sentinel) outside any
 * {@link MatForm}/{@link MatFormSubmittedProvider} ancestor.
 */
export function useMatFormState(): MatFormState {
  return useContext(MAT_FORM, NO_FORM);
}

/**
 * Whether the nearest enclosing {@link MatForm} has been submitted (`false` outside one). Part
 * of upstream's default `ErrorStateMatcher`: `control.invalid && (control.touched ||
 * form.submitted)`. Reactive when read during render.
 */
export function useMatFormSubmitted(): boolean {
  return useMatFormState().submitted;
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

/** Props for {@link MatFormSubmittedProvider}. */
export interface MatFormSubmittedProviderProps {
  /** Whether the externally-owned form has been submitted — feed this from whatever form
   *  library owns the real `<form>` element (e.g. Formisch's `form.isSubmitted.value`). Live:
   *  re-synced into the provided {@link MAT_FORM} context on every change. */
  submitted: boolean;
}

/**
 * Provides {@link MAT_FORM}'s "submitted" state to descendant Material controls — same effect
 * on `useMatFormSubmitted()`/the default `ErrorStateMatcher` as {@link MatForm} — WITHOUT
 * rendering a `<form>` element itself. Renders nothing but `<Slot/>`.
 *
 * For a form library that already renders its own native `<form>` (e.g. Formisch's `<Form>`,
 * which wraps a `<form>` and manages submission itself), `<MatForm>` can't ALSO wrap it — two
 * nested `<form>` elements isn't valid HTML, and Formisch, not this port, owns submission.
 * Nest this provider anywhere inside (or around) that `<form>` instead, feeding `submitted`
 * from the form library's own signal:
 *
 * ```tsx
 * <Form of={form} class={form.isSubmitted.value && 'ng-submitted'} onSubmit$={...}>
 *   <MatFormSubmittedProvider submitted={form.isSubmitted.value}>
 *     <MatFormField control={<MatInput .../>} ... />
 *   </MatFormSubmittedProvider>
 * </Form>
 * ```
 *
 * `ng-submitted` itself still needs to land on the REAL `<form>` element this provider doesn't
 * render — pass it through whatever mechanism the form library exposes for that (Formisch's
 * `<Form>` forwards an ordinary `class` prop onto the native element it renders, as shown
 * above; this is the "a consumer can put `class={...}`-equivalent" fallback `qwik-material/
 * README.md`'s "Using with Formisch" section documents — not a workaround, since `<Form>` has
 * no OTHER supported way to reach its own host element's class list).
 */
export const MatFormSubmittedProvider = component$<MatFormSubmittedProviderProps>(props => {
  const state = useStore<MatFormState>(() => ({submitted: props.submitted}));
  useContextProvider(MAT_FORM, state);
  useTask$(({track}) => {
    state.submitted = track(() => props.submitted);
  });
  return <Slot />;
});
