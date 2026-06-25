import {component$} from '@builder.io/qwik';
import {AutoOpen, DataBody} from '../../../scenarios/_template';

export default component$(() => (
  <AutoOpen Body={DataBody} config={{hasBackdrop: true, data: {msg: 'hello world'}} as any} />
));
