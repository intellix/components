import {$, component$, createContextId, useContext} from '@qwik.dev/core';
import {useMatDialog} from '@angular-community/qwik-material/dialog';
import {NgComponentHost} from '../../../scenarios/_mat-template';

/**
 * Exercises the generic app-context opt-in (`MatDialogConfig.context`):
 * an app's own context (not a qwik-material one) re-provided inside the
 * overlay via `config.context: [{ctx, value}]`.
 */
const APP_THEME = createContextId<{label: string}>('demo-app/theme');

const ThemedBody = component$<{class?: string}>(props => {
  const theme = useContext(APP_THEME);
  return (
    <NgComponentHost class={props.class}>
      <div class="theme-label" data-theme-label>
        {theme.label}
      </div>
    </NgComponentHost>
  );
});

const Runner = component$(() => {
  const dialog = useMatDialog();
  const onOpen$ = $(async () => {
    await dialog.open$(ThemedBody, {
      hasBackdrop: true,
      context: [{ctx: APP_THEME, value: {label: 'dark'}}],
    });
  });
  return (
    <button class="open-button" onClick$={onOpen$}>
      Open
    </button>
  );
});

export default component$(() => (
  <>
    <div data-parity-root>
      <Runner />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
