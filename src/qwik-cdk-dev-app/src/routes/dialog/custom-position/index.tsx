import {component$, useVisibleTask$} from '@qwik.dev/core';
import {useDialog} from '@angular-community/qwik-cdk/dialog';
import {createGlobalPositionStrategy} from '@angular-community/qwik-cdk/overlay';
import {ScenarioBody} from '../../../scenarios/_template';

export default component$(() => {
  const dialog = useDialog();
  useVisibleTask$(async () => {
    const pos = createGlobalPositionStrategy().top('10px').left('20px');
    await dialog.open$(ScenarioBody, {hasBackdrop: true, positionStrategy: pos} as any);
  });
  return (
    <>
      <div data-parity-root></div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
