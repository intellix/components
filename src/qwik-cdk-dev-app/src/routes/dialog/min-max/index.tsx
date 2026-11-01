import {component$} from '@qwik.dev/core';
import {AutoOpen} from '../../../scenarios/_template';

export default component$(() => (
  <AutoOpen
    config={
      {
        hasBackdrop: true,
        minWidth: '100px',
        maxWidth: '500px',
        minHeight: '100px',
        maxHeight: '300px',
      } as any
    }
  />
));
