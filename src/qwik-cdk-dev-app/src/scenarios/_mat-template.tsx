import {component$, Slot, useVisibleTask$} from '@qwik.dev/core';
import type {Component} from '@qwik.dev/core';
import {useContext} from '@qwik.dev/core';
import {useMatDialog, MAT_DIALOG_DATA} from '@angular-community/qwik-material/dialog';
import type {MatDialogConfig} from '@angular-community/qwik-material/dialog';

/**
 * None of the Angular Material dialog scenario bodies
 * (src/dev-app/qwik-parity/dialog.ts) declare a `selector`, so Angular's
 * ComponentPortal falls back to `<ng-component>` as their host tag — still
 * stamped with `mat-mdc-dialog-component-host` by `MatDialogContainer`
 * (the `display:flex` fix; see `MatDialogWrapper` in
 * qwik-material/dialog/mat-dialog.tsx, which passes that class down as
 * `props.class`). Every scenario body below forwards it onto this shared
 * host tag, mirroring what a consumer's own component would render.
 */
export const NgComponentHost = component$<{class?: string}>(props => (
  <ng-component class={props.class}>
    <Slot />
  </ng-component>
));

export const MatScenarioBody = component$<{class?: string}>(props => (
  <NgComponentHost class={props.class}>
    <div class="mat-scenario-body">Material scenario body</div>
  </NgComponentHost>
));

export const MatDataBody = component$<{class?: string}>(props => {
  const data = useContext(MAT_DIALOG_DATA) as {msg: string};
  return (
    <NgComponentHost class={props.class}>
      <div class="mat-scenario-body">{data.msg}</div>
    </NgComponentHost>
  );
});

export interface MatAutoOpenProps<D = unknown> {
  Body?: Component<any>;
  config?: MatDialogConfig<D>;
}

export const MatAutoOpen = component$<MatAutoOpenProps>(props => {
  const dialog = useMatDialog();
  useVisibleTask$(async () => {
    await dialog.open$(props.Body ?? MatScenarioBody, props.config as any);
  });
  return <main data-scenario-ready>ready</main>;
});
