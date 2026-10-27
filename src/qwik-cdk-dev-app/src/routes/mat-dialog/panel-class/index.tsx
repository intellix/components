import {component$} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen, NgComponentHost} from '../../../scenarios/_mat-template';

const Body = component$<{class?: string}>(props => (
  <NgComponentHost class={props.class}>
    <p>Panel classes applied</p>
  </NgComponentHost>
));

export default component$(() => (
  <QwikMaterialProvider>
    <div data-parity-root></div>
    <MatAutoOpen
      Body={Body}
      config={{hasBackdrop: true, panelClass: ['my-panel-a', 'my-panel-b']}}
    />
  </QwikMaterialProvider>
));
