import {component$} from '@qwik.dev/core';
import {AutoOpen, FocusableBody} from '../../../scenarios/_template';

export default component$(() => (
  <AutoOpen Body={FocusableBody} config={{hasBackdrop: true, autoFocus: false} as any} />
));
