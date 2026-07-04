import {component$} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen} from '../../../scenarios/_mat-template';

const Body = component$(() => <p>Press Escape to close</p>);

export default component$(() => (
  <QwikMaterialProvider>
    <MatAutoOpen Body={Body} config={{hasBackdrop: true}} />
  </QwikMaterialProvider>
));
