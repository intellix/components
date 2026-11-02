import {$, component$, useSignal} from '@qwik.dev/core';
import {MatTabGroup} from '@angular-community/qwik-material/tabs';
import {MatIcon} from '@angular-community/qwik-material/icon';

// Qwik port of material.angular.dev's `tab-group-custom-label` docs example. Rendered unmodified
// by the Angular dev-app at /qwik-parity/examples/tab-group-custom-label. Upstream's
// `<ng-template mat-tab-label>` becomes `MatTabDef.labelTemplate`.
//
// No `[(selectedIndex)]` binding upstream either -- a local signal keeps `<MatTabGroup>`'s
// controlled-component contract satisfied (see mat-tab-group.tsx: "Consumer owns the state"),
// same as every other interactive scenario in this dev-app/example set.

const tabLabel = (text: string) => (
  <>
    <MatIcon class="example-tab-icon">thumb_up</MatIcon>
    {text}
  </>
);

export default component$(() => {
  const selected = useSignal(0);

  return (
    <tab-group-custom-label-example>
      <MatTabGroup
        selectedIndex={selected.value}
        onSelectedIndexChange$={$((i: number) => {
          selected.value = i;
        })}
        tabs={[
          {labelTemplate: tabLabel('First'), content: ' Content 1 '},
          {labelTemplate: tabLabel('Second'), content: ' Content 2 '},
          {labelTemplate: tabLabel('Third'), content: ' Content 3 '},
        ]}
      />
    </tab-group-custom-label-example>
  );
});
