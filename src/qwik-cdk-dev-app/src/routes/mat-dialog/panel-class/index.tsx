import {component$} from '@qwik.dev/core';
import {MatAutoOpen, NgComponentHost} from '../../../scenarios/_mat-template';

const Body = component$<{class?: string}>(props => (
  <NgComponentHost class={props.class}>
    <p>Panel classes applied</p>
  </NgComponentHost>
));

export default component$(() => (
  <>
    <div data-parity-root></div>
    <MatAutoOpen
      Body={Body}
      config={{hasBackdrop: true, panelClass: ['my-panel-a', 'my-panel-b']}}
    />
  </>
));
