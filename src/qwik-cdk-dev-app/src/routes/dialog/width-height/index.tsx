import {component$} from '@qwik.dev/core';
import {AutoOpen} from '../../../scenarios/_template';

export default component$(() => (
  <AutoOpen config={{hasBackdrop: true, width: '300px', height: '200px'} as any} />
));
