import {component$} from '@builder.io/qwik';
import {
  QwikMaterialProvider,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen} from '../../../scenarios/_mat-template';

const Body = component$(() => (
  <>
    <MatDialogContent>Are you sure?</MatDialogContent>
    <MatDialogActions align="end">
      <MatDialogClose result="no">No</MatDialogClose>
      <MatDialogClose result="yes">Yes</MatDialogClose>
    </MatDialogActions>
  </>
));

export default component$(() => (
  <QwikMaterialProvider>
    <div data-parity-root></div>
    <MatAutoOpen Body={Body} config={{hasBackdrop: true}} />
  </QwikMaterialProvider>
));
