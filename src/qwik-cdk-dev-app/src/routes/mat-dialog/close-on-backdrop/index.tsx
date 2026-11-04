import {component$} from '@qwik.dev/core';
import {MatAutoOpen, NgComponentHost} from '../../../scenarios/_mat-template';

const Body = component$<{class?: string}>(props => (
  <NgComponentHost class={props.class}>
    <p>Click outside to close</p>
  </NgComponentHost>
));

export default component$(() => (
  <>
    <div data-parity-root></div>
    <MatAutoOpen Body={Body} config={{hasBackdrop: true}} />
  </>
));
