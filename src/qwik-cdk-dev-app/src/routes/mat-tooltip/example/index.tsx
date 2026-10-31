import {component$} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatButton} from '@angular-community/qwik-material/button';
import {useMatTooltip} from '@angular-community/qwik-material/tooltip';

/**
 * Port of material.angular.dev's `tooltip-overview` docs example
 * (src/components-examples/material/tooltip/tooltip-overview/). The real template stacks
 * `matButton="elevated"` and `matTooltip="…"` on one native `<button>`. Reproduced here with the
 * "directive hooks" pattern (`qwik-material/README.md`'s "Composing directives" section):
 * `useMatTooltip()` returns exactly what `[matTooltip]` contributes to its host (`hostProps` —
 * class, `aria-describedby`, the hover/focus/touch handlers), spread directly onto
 * `<MatButton appearance="elevated">`. This is the SAME engine `<MatTooltip as="button">` uses
 * internally (`qwik-material/tooltip/use-mat-tooltip.ts`), just called here the way a real
 * consumer migrating this exact Angular template would.
 *
 * Scope: this route's own interaction (see specs/examples/angular-parity.spec.ts) only HOVERS to
 * show the tooltip — a pure pointer interaction never moves focus, so the composed button never
 * needs its `useFocusOrigin()`-driven classes for this scenario (confirmed live: hovering never
 * adds a `cdk-*-focused` class to the real Angular trigger either).
 */
export default component$(() => {
  const tip = useMatTooltip({message: 'Info about the action'});

  return (
    <QwikMaterialProvider>
      <div data-parity-root>
        <tooltip-overview-example>
          <MatButton
            appearance="elevated"
            {...tip.hostProps}
            ariaLabel="Button that displays a tooltip when focused or hovered over"
          >
            Action
          </MatButton>
        </tooltip-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </QwikMaterialProvider>
  );
});
