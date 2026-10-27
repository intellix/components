import {component$} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen} from '../../../scenarios/_mat-template';

const DescribedBody = component$(() => <p id="my-desc">Description</p>);

export default component$(() => (
  <QwikMaterialProvider>
    <div data-parity-root></div>
    <MatAutoOpen Body={DescribedBody} config={{hasBackdrop: true, ariaDescribedBy: 'my-desc'}} />
  </QwikMaterialProvider>
));
