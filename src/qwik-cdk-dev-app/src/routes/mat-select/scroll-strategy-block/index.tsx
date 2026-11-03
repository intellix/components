import {component$, useSignal} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';

/**
 * Demonstrates overriding `MAT_SELECT_SCROLL_STRATEGY`'s default
 * (`{type: 'reposition'}`) with the `block` strategy instead, via
 * `<QwikMaterialProvider matSelectScrollStrategy="block">` — a plain,
 * serializable `ScrollStrategyDescriptor` (see `qwik-cdk/overlay/scroll/
 * scroll-strategy-descriptor.ts`), not a function factory. See
 * `select/SYNC.md`'s "Scroll-strategy configuration" entry.
 *
 * A tall spacer makes the page scrollable, which `BlockScrollStrategy`
 * requires to actually apply its `cdk-global-scrollblock` marker class.
 */
export default component$(() => {
  const value = useSignal('');

  return (
    <QwikMaterialProvider matSelectScrollStrategy="block">
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Fruit</MatLabel>}
          control={
            <MatSelect
              controlType="mat-select"
              value={value.value}
              onValueChange$={v => (value.value = v as string)}
              options={[
                {value: 'apple', label: 'Apple'},
                {value: 'banana', label: 'Banana'},
                {value: 'cherry', label: 'Cherry'},
              ]}
            />
          }
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
      <div style="height: 3000px;" />
    </QwikMaterialProvider>
  );
});
