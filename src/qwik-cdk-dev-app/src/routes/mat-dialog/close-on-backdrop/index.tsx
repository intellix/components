import {component$} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen} from '../../../scenarios/_mat-template';

const Body = component$(() => <p>Click outside to close</p>);

export default component$(() => (
  <QwikMaterialProvider>
    <div data-parity-root></div>
    <MatAutoOpen Body={Body} config={{hasBackdrop: true}} />
  </QwikMaterialProvider>
));
