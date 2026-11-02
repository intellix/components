import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatFormField, MatLabel, useMatFormControl} from '@angular-community/qwik-material/form-field';
import {MatSelect, type MatSelectOptionDef} from '@angular-community/qwik-material/select';
import {MatButton} from '@angular-community/qwik-material/button';
import {useMatTooltip, type TooltipPosition} from '@angular-community/qwik-material/tooltip';
import styles from './example.css?inline';

const POSITION_OPTIONS: readonly TooltipPosition[] = ['after', 'before', 'above', 'below', 'left', 'right'];

/**
 * Port of material.angular.dev's `tooltip-position` docs example
 * (src/components-examples/material/tooltip/tooltip-position/). Upstream binds a reactive-forms
 * `FormControl` to `<mat-select>`, which is why its `<mat-form-field>`/`<mat-select>` carry
 * `NgControlStatus`'s `ng-pristine ng-untouched ng-valid` classes from the very first render —
 * reproduced here with the established `useMatFormControl()` + `formBound` pattern (see
 * `dialog/example/index.tsx`), NOT Angular Forms integration (this port has none — see
 * tooltip/SYNC.md). The action button composes `useMatTooltip()` onto `<MatButton>`, same
 * pattern as `tooltip/example`.
 *
 * `[value]="positionOption"` is a bound property upstream (never echoed as a static attribute),
 * so each option def sets `echoValueAttr: false` — same rationale as `select/example`.
 */
export default component$(() => {
  useStyles$(styles);
  const position = useSignal<TooltipPosition>(POSITION_OPTIONS[0]);
  const fc = useMatFormControl();
  const tip = useMatTooltip({message: 'Info about the action', position: position.value});

  const options: MatSelectOptionDef<TooltipPosition>[] = POSITION_OPTIONS.map(p => ({
    value: p,
    label: p,
    echoValueAttr: false,
  }));

  return (
    <tooltip-position-example>
      <MatFormField
        class="example-user-input"
        label={<MatLabel>Tooltip position</MatLabel>}
        touched={fc.touched}
        dirty={fc.dirty}
        invalid={false}
        control={
          <MatSelect
            controlType="mat-select"
            formBound
            touched={fc.touched}
            dirty={fc.dirty}
            invalid={false}
            options={options}
            value={position.value}
            onValueChange$={v => {
              fc.markAsDirty$();
              position.value = v as TooltipPosition;
            }}
            onTouched$={fc.markAsTouched$}
          />
        }
      />

      <MatButton
        appearance="elevated"
        {...tip.hostProps}
        ariaLabel="Button that displays a tooltip in various positions"
      >
        Action
      </MatButton>
    </tooltip-position-example>
  );
});
