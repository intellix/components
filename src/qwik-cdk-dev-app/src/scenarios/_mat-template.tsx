import {component$, useVisibleTask$} from '@builder.io/qwik';
import type {Component} from '@builder.io/qwik';
import {useContext} from '@builder.io/qwik';
import {useMatDialog, MAT_DIALOG_DATA} from '@angular-community/qwik-material/dialog';
import type {MatDialogConfig} from '@angular-community/qwik-material/dialog';

export const MatScenarioBody = component$(() => (
  <div class="mat-scenario-body">Material scenario body</div>
));

export const MatDataBody = component$(() => {
  const data = useContext(MAT_DIALOG_DATA) as {msg: string};
  return <div class="mat-scenario-body">{data.msg}</div>;
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
