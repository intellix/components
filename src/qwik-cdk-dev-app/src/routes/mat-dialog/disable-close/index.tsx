import {component$} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen} from '../../../scenarios/_mat-template';

export default component$(() => (
  <QwikMaterialProvider>
    <MatAutoOpen config={{hasBackdrop: true, disableClose: true}} />
  </QwikMaterialProvider>
));
