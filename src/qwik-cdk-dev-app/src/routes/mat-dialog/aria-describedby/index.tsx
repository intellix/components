import {component$} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen, NgComponentHost} from '../../../scenarios/_mat-template';

const DescribedBody = component$<{class?: string}>(props => (
  <NgComponentHost class={props.class}>
    <p id="my-desc">Description</p>
  </NgComponentHost>
));

export default component$(() => (
  <QwikMaterialProvider>
    <div data-parity-root></div>
    <MatAutoOpen Body={DescribedBody} config={{hasBackdrop: true, ariaDescribedBy: 'my-desc'}} />
  </QwikMaterialProvider>
));
