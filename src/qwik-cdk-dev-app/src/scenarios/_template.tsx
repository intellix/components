import {component$, useVisibleTask$} from '@qwik.dev/core';
import type {Component} from '@qwik.dev/core';
import {useDialog, DIALOG_DATA} from '@angular-community/qwik-cdk/dialog';
import type {DialogConfig} from '@angular-community/qwik-cdk/dialog';
import {useContext} from '@qwik.dev/core';

// Each body below wraps its content in the same custom-element tag name as
// the Angular mirror component's explicit `selector`
// (src/dev-app/qwik-parity/cdk-dialog.ts) — mirroring what a consumer's own
// component would render as its own host element, since Angular's
// ComponentPortal always gives the attached component a host element named
// after its selector.

export const ScenarioBody = component$(() => (
  <cdk-dialog-scenario-body>
    <div class="scenario-body">scenario</div>
  </cdk-dialog-scenario-body>
));

export const DataBody = component$(() => {
  const data = useContext(DIALOG_DATA) as {msg: string};
  return (
    <cdk-dialog-data-body>
      <div class="scenario-body">{data.msg}</div>
    </cdk-dialog-data-body>
  );
});

export const FocusableBody = component$(() => (
  <cdk-dialog-focusable-body>
    <h2>Heading</h2>
    <button class="first-button">First</button>
    <input class="text-input" type="text" />
  </cdk-dialog-focusable-body>
));

export const LabelledBody = component$(() => (
  <cdk-dialog-labelled-body>
    <h2 id="dialog-title">Title</h2>
    <p>Content</p>
  </cdk-dialog-labelled-body>
));

export const DescribedBody = component$(() => (
  <cdk-dialog-described-body>
    <h2>Title</h2>
    <p id="dialog-desc">Description</p>
  </cdk-dialog-described-body>
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
