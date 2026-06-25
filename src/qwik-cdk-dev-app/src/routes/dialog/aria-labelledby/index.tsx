import {component$} from '@builder.io/qwik';
import {AutoOpen, LabelledBody} from '../../../scenarios/_template';

export default component$(() => (
  <AutoOpen
    Body={LabelledBody}
    config={{hasBackdrop: true, ariaLabelledBy: 'dialog-title'} as any}
  />
));
