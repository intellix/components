import {component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {
  useMatTooltip,
  useMatTooltipProvider,
  type MatTooltipDefaultOptions,
} from '@angular-community/qwik-material/tooltip';

/**
 * Port of material.angular.dev's `tooltip-modified-defaults` docs example
 * (src/components-examples/material/tooltip/tooltip-modified-defaults/). Upstream provides
 * `MAT_TOOLTIP_DEFAULT_OPTIONS` at the app root; this port's equivalent is
 * `useMatTooltipProvider({...})` (see tooltip/mat-tooltip-tokens.ts's own doc comment). The
 * button itself passes no `showDelay`/`hideDelay` — it inherits them from the provider, same
 * as upstream's tooltip inherits from the injected config.
 */
const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 1000,
  touchendHideDelay: 1000,
};

export default component$(() => {
  const tip = useMatTooltip({message: 'By default, I delay'});

  useMatTooltipProvider(myCustomTooltipDefaults);

  return (
    <tooltip-modified-defaults-example>
      <MatButton
        appearance="elevated"
        {...tip.hostProps}
        ariaLabel="Button that displays a tooltip that has custom delays through a default config"
      >
        Button with delay-default tooltip
      </MatButton>
    </tooltip-modified-defaults-example>
  );
});
