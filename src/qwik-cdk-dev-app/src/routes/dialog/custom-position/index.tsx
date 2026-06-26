import {component$, useVisibleTask$} from '@builder.io/qwik';
import {useDialog} from '@angular-community/qwik-cdk/dialog';
import {GlobalPositionStrategy} from '@angular-community/qwik-cdk/overlay';
import {ScenarioBody} from '../../../scenarios/_template';

export default component$(() => {
  const dialog = useDialog();
  useVisibleTask$(async () => {
    const pos = new GlobalPositionStrategy().top('10px').left('20px');
    await dialog.open$(ScenarioBody, {hasBackdrop: true, positionStrategy: pos} as any);
  });
  return <main data-scenario-ready>ready</main>;
});
