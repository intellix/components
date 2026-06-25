import {component$} from '@builder.io/qwik';
import {AutoOpen, DescribedBody} from '../../../scenarios/_template';

export default component$(() => (
  <AutoOpen
    Body={DescribedBody}
    config={{hasBackdrop: true, ariaDescribedBy: 'dialog-desc'} as any}
  />
));
