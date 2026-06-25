import {component$} from '@builder.io/qwik';
import {AutoOpen, FocusableBody} from '../../../scenarios/_template';

export default component$(() => (
  <AutoOpen Body={FocusableBody} config={{hasBackdrop: true, autoFocus: 'first-tabbable'} as any} />
));
