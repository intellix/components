import {component$, useStyles$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {useMatTooltip} from '@angular-community/qwik-material/tooltip';
import styles from './example.css?inline';

/**
 * Port of material.angular.dev's `tooltip-manual` docs example
 * (src/components-examples/material/tooltip/tooltip-manual/).
 *
 * UNPORTED FEATURE (large, not a small fixable bug — see qwik-material/tooltip/use-mat-tooltip.ts:
 * `MatTooltipHook` only has a `hostProps` field, no imperative `show()`/`hide()`/`toggle()`
 * methods at all). Upstream's whole point here is a template-ref handle (`#tooltip="matTooltip"`)
 * that three OTHER buttons call `.show()`/`.hide()`/`.toggle()` on — this port has no such handle
 * to call. The three control buttons are kept (same DOM shape as upstream) but their `onClick$`
 * is a documented no-op; there is currently no way to make them actually drive the tooltip.
 * Tracked as an expected parity failure for any interaction exercising these buttons
 * (`specs/examples-misc/angular-parity.spec.ts`) — the base, no-interaction render still matches.
 */
export default component$(() => {
  useStyles$(styles);
  const tip = useMatTooltip({message: 'Info about the action', position: 'right'});

  return (
    <tooltip-manual-example>
      <div>
        <span> Click the following buttons to... </span>
        <MatButton
          class="example-action-button"
          ariaLabel="Show tooltip on the button at the end of this section"
        >
          show
        </MatButton>
        <MatButton
          class="example-action-button"
          ariaLabel="Hide tooltip on the button at the end of this section"
        >
          hide
        </MatButton>
        <MatButton
          class="example-action-button"
          ariaLabel="Show/Hide tooltip on the button at the end of this section"
        >
          toggle show/hide
        </MatButton>
      </div>

      <MatButton
        appearance="elevated"
        {...tip.hostProps}
        {...({
          'aria-tooltip': 'Button that displays and hides a tooltip triggered by other buttons',
        } as Record<string, string>)}
      >
        Action
      </MatButton>
    </tooltip-manual-example>
  );
});
