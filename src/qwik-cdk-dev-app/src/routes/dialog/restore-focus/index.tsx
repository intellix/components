import {component$, useVisibleTask$} from '@builder.io/qwik';
import {useDialog} from '@angular-community/qwik-cdk/dialog';
import {ScenarioBody} from '../../../scenarios/_template';

export default component$(() => {
  const dialog = useDialog();
  useVisibleTask$(async () => {
    const trigger = document.querySelector<HTMLElement>('.restore-trigger');
    trigger?.focus();
    await dialog.open$(ScenarioBody, {hasBackdrop: true, restoreFocus: true} as any);
  });
  return (
    <main data-scenario-ready>
      <button class="restore-trigger">trigger</button>
    </main>
  );
});
