import {component$} from '@builder.io/qwik';
import {AutoOpen} from '../../../scenarios/_template';

export default component$(() => (
  <AutoOpen config={{hasBackdrop: true, width: '300px', height: '200px'} as any} />
));
