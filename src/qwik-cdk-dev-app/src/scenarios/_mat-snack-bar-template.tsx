import {$, component$, useContext} from '@qwik.dev/core';
import {
  MAT_SNACK_BAR_DATA,
  MAT_SNACK_BAR_REF,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
} from '@angular-community/qwik-material/snack-bar';

/**
 * Content component for the `custom-component` mat-snack-bar scenario.
 * Mirrors `src/dev-app/qwik-parity/snack-bar.ts`'s `ParitySnackBarContent`
 * (itself mirroring upstream's annotated-custom-component example): a
 * `matSnackBarLabel` element, a `matSnackBarActions` wrapper containing one
 * `matButton matSnackBarAction` button that calls `dismissWithAction()`.
 *
 * Given an explicit host tag (`<parity-snack-bar-content>`, see
 * `../scenarios/intrinsic-elements.d.ts`) matching the Angular body's
 * explicit `selector` — see `angular-parity.spec.ts`'s header comment
 * "CUSTOM COMPONENT HOST TAG".
 */
export const ParitySnackBarContent = component$(() => {
  const snackBarRef = useContext(MAT_SNACK_BAR_REF, undefined);
  const onView$ = $(() => snackBarRef?.dismissWithAction());

  return (
    <parity-snack-bar-content>
      <MatSnackBarLabel as="span">Order confirmed</MatSnackBarLabel>
      <MatSnackBarActions as="span">
        <MatSnackBarAction onClick$={onView$}>View</MatSnackBarAction>
      </MatSnackBarActions>
    </parity-snack-bar-content>
  );
});

/**
 * Content component for the `from-template` mat-snack-bar scenario. Mirrors
 * `src/dev-app/qwik-parity/snack-bar.ts`'s `SnackBarFromTemplate`'s
 * `<ng-template #tpl>Delivered to {{ recipient }}</ng-template>` — a bare
 * interpolated-text embedded view with NO wrapping host element (Angular's
 * `TemplatePortal`, unlike `ComponentPortal`, never introduces one). Renders
 * only a text node for the same reason — no host tag at all.
 *
 * Deviation: Angular's `recipient` is a field on the enclosing
 * `SnackBarFromTemplate` component, captured by the template's lexical
 * scope — Qwik has no `TemplateRef`/ambient-scope-capture equivalent. The
 * fixed value is passed through `config.data` (the mechanism this port
 * already has for getting data into attached content) instead.
 */
export const FromTemplateContent = component$(() => {
  const data = useContext(MAT_SNACK_BAR_DATA) as {recipient: string} | undefined;
  return <>Delivered to {data?.recipient ?? 'Alex'}</>;
});
