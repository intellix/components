import {$, useSignal, type QRL, type Signal} from '@qwik.dev/core';
import type {StepControl} from '@angular-community/qwik-cdk/stepper';

/**
 * Local stand-in for the shared reactive-forms primitive the port's design
 * notes point at (`qwik-material/core`'s `useMatFormControl()` /
 * `mat-form-field-control.ts`, added on `port/form-field` —
 * `1dacc215a595bba1890c33dafcf83073e87b43d9`). That branch had NOT merged
 * into this worktree's base as of this port (confirmed via `git log
 * --oneline --all` / `git merge-base --is-ancestor`), so `qwik-material/
 * core` here only has `mat-pseudo-checkbox`/`mat-internal-form-field` — no
 * `mat-form-control.ts` to import.
 *
 * Scope, per the task: the stepper's own `linear-required`/`error-state`
 * scenarios need JUST enough reactive-forms behavior to exercise
 * `CdkStepper`'s `linear`/`stepControl` gating and reproduce Angular's
 * `NgControlStatus` classes (`ng-untouched`/`ng-pristine`/`ng-invalid`/
 * `ng-dirty`/`ng-valid`/`ng-touched`) on a BARE `<input>` — no
 * `mat-form-field`/`matInput`, no validators module, no two-way directive.
 * `useRequiredControl()` below is intentionally this narrow: a single
 * required-text-field control, value/touched/dirty signals a consumer wires
 * onto a plain `<input>` itself (see `mat-stepper-scenarios.spec.tsx` and
 * the dev-app's `mat-stepper/linear-required`/`error-state` routes).
 *
 * TODO once `port/form-field` merges: replace every call site of this file
 * with the shared `useMatFormControl()` + its validator combinators, and
 * delete this file. Tracked in this entry's SYNC.md.
 */
export interface RequiredControlApi {
  value: Signal<string>;
  touched: Signal<boolean>;
  dirty: Signal<boolean>;
  /** Live `StepControl` snapshot — pass directly as `MatStepDef.stepControl`.
   *  A plain Signal (not a getter) so the caller can read `.value` fresh on
   *  every render, same as any other Qwik signal. */
  control: Signal<StepControl>;
  onInput$: QRL<(event: Event, element: HTMLInputElement) => void>;
  onBlur$: QRL<() => void>;
  /** Angular Forms' `NgControlStatus` class list for the current state —
   *  mirrors angular-parity.spec.ts note 9. */
  ngClasses: Signal<string[]>;
}

/** A required, plain-text control. Starts untouched/pristine/invalid (empty). */
export function useRequiredControl(): RequiredControlApi {
  const value = useSignal('');
  const touched = useSignal(false);
  const dirty = useSignal(false);

  const valid = useSignal(() => value.value.trim() !== '');
  // Re-derive `valid` declaratively would normally be a computed signal, but
  // this project has no `useComputed$` dependency pinned project-wide (see
  // other entry points' plain-signal-plus-manual-update pattern) — update it
  // alongside `value` in the same handler instead.

  const control = useSignal<StepControl>({valid: valid.value, invalid: !valid.value});
  const ngClasses = useSignal<string[]>(['ng-untouched', 'ng-pristine', 'ng-invalid']);

  // A plain (non-`$()`) closure can't safely cross a QRL boundary — Qwik's
  // optimizer only captures serializable bindings (signals, primitives)
  // across a `$()` scope, not arbitrary outer-scope functions. `recompute$`
  // is itself a QRL so `onInput$`/`onBlur$` can call it the same way
  // `qwik-material/tabs/use-paginated-header.ts`'s `scroll` QRL is called
  // from `mat-tab-group.tsx`'s `onScrollBefore$`.
  const recompute$ = $(() => {
    valid.value = value.value.trim() !== '';
    control.value = {valid: valid.value, invalid: !valid.value};
    ngClasses.value = [
      touched.value ? 'ng-touched' : 'ng-untouched',
      dirty.value ? 'ng-dirty' : 'ng-pristine',
      valid.value ? 'ng-valid' : 'ng-invalid',
    ];
  });

  const onInput$ = $((_event: Event, element: HTMLInputElement) => {
    value.value = element.value;
    dirty.value = true;
    recompute$();
  });

  const onBlur$ = $(() => {
    touched.value = true;
    recompute$();
  });

  return {value, touched, dirty, control, onInput$, onBlur$, ngClasses};
}
