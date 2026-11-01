import {component$} from '@qwik.dev/core';
import {QwikMaterialProvider, MatDialogTitle} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen, NgComponentHost} from '../../../scenarios/_mat-template';

const LabelledBody = component$<{class?: string}>(props => (
  <NgComponentHost class={props.class}>
    <MatDialogTitle>Custom title</MatDialogTitle>
    <p>Body</p>
  </NgComponentHost>
));

export default component$(() => (
  <QwikMaterialProvider>
    <div data-parity-root></div>
    <MatAutoOpen Body={LabelledBody} config={{hasBackdrop: true}} />
  </QwikMaterialProvider>
));
