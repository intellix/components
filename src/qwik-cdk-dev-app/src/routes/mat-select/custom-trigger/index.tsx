import {component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';

// Mirrors src/dev-app/qwik-parity/select.ts's SelectCustomTrigger —
// `[multiple]="true"` plus a `<mat-select-trigger>` projecting a `<span>`
// with the first selected value and a conditional "(+N more)" span. Since
// `MatSelectTrigger` upstream is a bare structural directive with no host
// of its own (select.ts's header note), this port's `customTrigger` prop
// just takes the content directly — see mat-select.tsx's doc comment.
// `customTrigger` is reconstructed fresh every time `value.value` changes
// (via `onValueChange$`), which is what keeps it live despite `<MatSelect>`
// itself being nested inside `<MatFormField control={...}>` — see
// mat-select.tsx's own "why value is not a live prop" write-up: `MatSelect`
// reads `customTrigger` as a genuine top-level prop on itself, which IS the
// proven-live shape, even though `value`/`options` themselves are only
// read once.
export default component$(() => {
  const value = useSignal<string[]>(['cheese', 'mushroom', 'onion']);

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Toppings</MatLabel>}
          control={
            <MatSelect
              controlType="mat-select"
              multiple
              value={value.value}
              onValueChange$={v => (value.value = v as string[])}
              customTrigger={
                <>
                  <span>{value.value[0] || ''}</span>
                  {value.value.length > 1 && (
                    <span class="extra-count">(+{value.value.length - 1} more)</span>
                  )}
                </>
              }
              options={[
                {value: 'cheese', label: 'Extra cheese'},
                {value: 'mushroom', label: 'Mushroom'},
                {value: 'onion', label: 'Onion'},
                {value: 'pepperoni', label: 'Pepperoni'},
              ]}
            />
          }
        />
        <p>Value: {value.value.join(',')}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
