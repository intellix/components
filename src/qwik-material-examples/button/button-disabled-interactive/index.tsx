import {component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {useMatTooltip} from '@angular-community/qwik-material/tooltip';
import styles from './example.css?inline';
import {useStyles$} from '@qwik.dev/core';

/**
 * Port of material.angular.dev's `button-disabled-interactive` docs example
 * (src/components-examples/material/button/button-disabled-interactive/). Both buttons stack
 * `matButton="elevated"` with `matTooltip="…"` on one native `<button>` — reproduced with the
 * "directive hooks" pattern (`qwik-material/README.md`'s "Composing directives" section, same as
 * `tooltip/example`): `useMatTooltip()` returns exactly what `[matTooltip]` contributes to its
 * host, spread directly onto `<MatButton>`.
 */
export default component$(() => {
  useStyles$(styles);
  const interactiveTip = useMatTooltip({message: 'This is a tooltip!'});
  const defaultTip = useMatTooltip({message: 'This is a tooltip!'});

  return (
    <button-disabled-interactive-example>
      <MatButton appearance="elevated" disabled disabledInteractive {...interactiveTip.hostProps}>
        Disabled button allowing interactivity
      </MatButton>

      <MatButton appearance="elevated" disabled {...defaultTip.hostProps}>
        Default disabled button
      </MatButton>
    </button-disabled-interactive-example>
  );
});
