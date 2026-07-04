import {component$} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen} from '../../../scenarios/_mat-template';

const Body = component$(() => <p>Panel classes applied</p>);

export default component$(() => (
  <QwikMaterialProvider>
    <MatAutoOpen
      Body={Body}
      config={{hasBackdrop: true, panelClass: ['my-panel-a', 'my-panel-b']}}
    />
  </QwikMaterialProvider>
));
