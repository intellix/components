import {component$, useSignal, useVisibleTask$} from '@qwik.dev/core';
import {MatTabGroup} from '@angular-community/qwik-material/tabs';

// Qwik port of material.angular.dev's `tab-group-lazy-loaded` docs example — see
// src/components-examples/material/tabs/tab-group-lazy-loaded/tab-group-lazy-loaded-example.
// {ts,html}. Rendered unmodified by the Angular dev-app at
// /qwik-parity/examples/tab-group-lazy-loaded.
//
// Every `MatTabDef.content` in this port is ALREADY lazy (only rendered once a tab first
// centers -- see mat-tab-group.tsx's own doc comment on `content`), unlike upstream where lazy
// loading via `<ng-template matTabContent>` is opt-in (plain content is eager by default). So
// there's no separate "lazy" variant to demonstrate structurally -- the observable behavior
// (a load timestamp stamped once per tab) is still faithfully reproduced.
//
// The timestamp is stamped in a `useVisibleTask$` (client-side only), NOT a `useSignal`
// initializer -- confirmed live: a `useSignal(() => new Date())` initializer runs during SSR
// (real server wall-clock time), while upstream's Angular dev-app is pure CSR (`new Date()` runs
// in the browser, after the parity harness's `page.clock.setFixedTime()` has already frozen it).
// Computing it server-side baked in the wrong (real, unfrozen) timestamp, failing the frozen-clock
// comparison every time. Stamping it client-side instead matches Angular's own timing exactly.
//
// `{{ getTimeLoaded(1) | date:'medium' }}` -> `Intl.DateTimeFormat('en-US', {dateStyle:'medium',
// timeStyle:'medium'})`, confirmed live to match Angular's `DatePipe` 'medium' format exactly for
// this locale.
const formatter = new Intl.DateTimeFormat('en-US', {dateStyle: 'medium', timeStyle: 'medium'});

export default component$(() => {
  const loadTimes = useSignal<Date[]>([]);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    loadTimes.value = [new Date(), new Date(), new Date()];
  });

  const label = (n: number, i: number) =>
    loadTimes.value[i] ? `Content ${n} - Loaded: ${formatter.format(loadTimes.value[i])}` : `Content ${n} - Loaded: `;

  return (
    <tab-group-lazy-loaded-example>
      <MatTabGroup
        tabs={[
          {label: 'First', content: label(1, 0)},
          {label: 'Second', content: label(2, 1)},
          {label: 'Third', content: label(3, 2)},
        ]}
      />
    </tab-group-lazy-loaded-example>
  );
});
