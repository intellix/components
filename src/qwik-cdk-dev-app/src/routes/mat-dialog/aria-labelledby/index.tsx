import {component$} from '@builder.io/qwik';
import {QwikMaterialProvider, MatDialogTitle} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen} from '../../../scenarios/_mat-template';

const LabelledBody = component$(() => (
  <>
    <MatDialogTitle>Custom title</MatDialogTitle>
    <p>Body</p>
  </>
));

export default component$(() => (
  <QwikMaterialProvider>
    <div data-parity-root></div>
    <MatAutoOpen Body={LabelledBody} config={{hasBackdrop: true}} />
  </QwikMaterialProvider>
));
