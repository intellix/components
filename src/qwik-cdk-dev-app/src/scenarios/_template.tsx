import {component$, useVisibleTask$} from '@builder.io/qwik';
import type {Component} from '@builder.io/qwik';
import {useDialog, DIALOG_DATA} from '@angular-community/qwik-cdk/dialog';
import type {DialogConfig} from '@angular-community/qwik-cdk/dialog';
import {useContext} from '@builder.io/qwik';

export const ScenarioBody = component$(() => <div class="scenario-body">scenario</div>);

export const DataBody = component$(() => {
  const data = useContext(DIALOG_DATA) as {msg: string};
  return <div class="scenario-body">{data.msg}</div>;
});

export const FocusableBody = component$(() => (
  <>
    <h2>Heading</h2>
    <button class="first-button">First</button>
    <input class="text-input" type="text" />
  </>
));

export const LabelledBody = component$(() => (
  <>
    <h2 id="dialog-title">Title</h2>
    <p>Content</p>
  </>
));

export const DescribedBody = component$(() => (
  <>
    <h2>Title</h2>
    <p id="dialog-desc">Description</p>
  </>
));

export interface AutoOpenProps<D = unknown> {
  Body?: Component<any>;
  config?: DialogConfig<D, any>;
}

export const AutoOpen = component$<AutoOpenProps>(props => {
  const dialog = useDialog();
  useVisibleTask$(async () => {
    await dialog.open$(props.Body ?? ScenarioBody, props.config);
  });
  return (
    <>
      <div data-parity-root></div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
