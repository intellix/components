import {component$} from '@qwik.dev/core';
import {
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen, NgComponentHost} from '../../../scenarios/_mat-template';

const Body = component$<{class?: string}>(props => (
  <NgComponentHost class={props.class}>
    <MatDialogContent>Are you sure?</MatDialogContent>
    <MatDialogActions align="end">
      <MatDialogClose result="no">No</MatDialogClose>
      <MatDialogClose result="yes">Yes</MatDialogClose>
    </MatDialogActions>
  </NgComponentHost>
));

export default component$(() => (
  <>
    <div data-parity-root></div>
    <MatAutoOpen Body={Body} config={{hasBackdrop: true}} />
  </>
));
