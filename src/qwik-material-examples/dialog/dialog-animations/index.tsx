import {component$, useStyles$} from '@qwik.dev/core';
import {useMatDialog} from '@angular-community/qwik-material/dialog';
import {MatButton} from '@angular-community/qwik-material/button';
import DialogAnimationsDialog from './dialog';
import styles from './example.css?inline';

/**
 * Port of material.angular.dev's `dialog-animations` docs example
 * (src/components-examples/material/dialog/dialog-animations/). Two elevated-appearance
 * triggers, each opening the same dialog with different `enterAnimationDuration`/
 * `exitAnimationDuration`.
 */
export default component$(() => {
  useStyles$(styles);
  const dialog = useMatDialog();

  return (
    <>
      <dialog-animations-example>
        <MatButton
          appearance="elevated"
          onClick$={() =>
            dialog.open$(DialogAnimationsDialog, {
              width: '250px',
              enterAnimationDuration: '0ms',
              exitAnimationDuration: '0ms',
            })
          }
        >
          Open dialog without animation
        </MatButton>
        <MatButton
          appearance="elevated"
          onClick$={() =>
            dialog.open$(DialogAnimationsDialog, {
              width: '250px',
              enterAnimationDuration: '3000ms',
              exitAnimationDuration: '1500ms',
            })
          }
        >
          Open dialog slowly
        </MatButton>
      </dialog-animations-example>
    </>
  );
});
