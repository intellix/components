import {component$} from '@qwik.dev/core';
import {AutoOpen} from '../../../scenarios/_template';

export default component$(() => (
  <AutoOpen config={{hasBackdrop: true, panelClass: ['my-panel', 'another-panel']} as any} />
));
