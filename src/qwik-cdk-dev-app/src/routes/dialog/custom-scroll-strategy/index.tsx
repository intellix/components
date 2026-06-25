import {component$, useVisibleTask$} from '@builder.io/qwik';
import {useDialog} from '@angular-community/qwik-cdk/dialog';
import {BlockScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import {ScenarioBody} from '../../../scenarios/_template';

export default component$(() => {
  const dialog = useDialog();
  useVisibleTask$(() => {
    const scroll = new BlockScrollStrategy();
    dialog.open(ScenarioBody, {hasBackdrop: true, scrollStrategy: scroll} as any);
  });
  return <main data-scenario-ready>ready</main>;
});
