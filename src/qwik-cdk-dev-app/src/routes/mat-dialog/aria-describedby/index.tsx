import {component$} from '@qwik.dev/core';
import {MatAutoOpen, NgComponentHost} from '../../../scenarios/_mat-template';

const DescribedBody = component$<{class?: string}>(props => (
  <NgComponentHost class={props.class}>
    <p id="my-desc">Description</p>
  </NgComponentHost>
));

export default component$(() => (
  <>
    <div data-parity-root></div>
    <MatAutoOpen Body={DescribedBody} config={{hasBackdrop: true, ariaDescribedBy: 'my-desc'}} />
  </>
));
