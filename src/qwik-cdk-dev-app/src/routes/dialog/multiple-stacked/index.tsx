import {component$, useVisibleTask$} from '@builder.io/qwik';
import {useDialog} from '@angular-community/qwik-cdk/dialog';
import {ScenarioBody} from '../../../scenarios/_template';

export default component$(() => {
  const dialog = useDialog();
  useVisibleTask$(async () => {
    await dialog.open$(ScenarioBody, {id: 'a', hasBackdrop: true} as any);
    await dialog.open$(ScenarioBody, {id: 'b', hasBackdrop: true} as any);
  });
  return <main data-scenario-ready>ready</main>;
});
