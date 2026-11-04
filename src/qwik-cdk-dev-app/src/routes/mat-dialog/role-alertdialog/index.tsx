import {component$} from '@qwik.dev/core';
import {MatAutoOpen} from '../../../scenarios/_mat-template';

export default component$(() => (
  <>
    <div data-parity-root></div>
    <MatAutoOpen config={{hasBackdrop: true, role: 'alertdialog'}} />
  </>
));
