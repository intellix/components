import {component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen} from '../../../scenarios/_mat-template';

export default component$(() => (
  <QwikMaterialProvider>
    <div data-parity-root></div>
    <MatAutoOpen config={{hasBackdrop: true}} />
  </QwikMaterialProvider>
));
