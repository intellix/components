import {component$, useVisibleTask$} from '@qwik.dev/core';
import {useDialog} from '@angular-community/qwik-cdk/dialog';
import {createBlockScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import {ScenarioBody} from '../../../scenarios/_template';

export default component$(() => {
  const dialog = useDialog();
  useVisibleTask$(async () => {
    const scroll = createBlockScrollStrategy();
    await dialog.open$(ScenarioBody, {hasBackdrop: true, scrollStrategy: scroll} as any);
  });
  return (
    <>
      <div data-parity-root></div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
