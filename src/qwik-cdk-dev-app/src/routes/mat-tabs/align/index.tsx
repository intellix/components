import {component$, useSignal} from '@builder.io/qwik';
import {MatTabGroup} from '@angular-community/qwik-material/tabs';

export default component$(() => {
  const selectedStart = useSignal(0);
  const selectedCenter = useSignal(0);
  const selectedEnd = useSignal(0);

  return (
    <>
      <div data-parity-root>
        <MatTabGroup
          style="width: 320px"
          stretchTabs={false}
          alignTabs="start"
          selectedIndex={selectedStart.value}
          onSelectedIndexChange$={i => {
            selectedStart.value = i;
          }}
          tabs={[
            {label: 'First', content: 'Content 1'},
            {label: 'Second', content: 'Content 2'},
          ]}
        />
        <MatTabGroup
          style="width: 320px"
          stretchTabs={false}
          alignTabs="center"
          selectedIndex={selectedCenter.value}
          onSelectedIndexChange$={i => {
            selectedCenter.value = i;
          }}
          tabs={[
            {label: 'First', content: 'Content 1'},
            {label: 'Second', content: 'Content 2'},
          ]}
        />
        <MatTabGroup
          style="width: 320px"
          stretchTabs={false}
          alignTabs="end"
          selectedIndex={selectedEnd.value}
          onSelectedIndexChange$={i => {
            selectedEnd.value = i;
          }}
          tabs={[
            {label: 'First', content: 'Content 1'},
            {label: 'Second', content: 'Content 2'},
          ]}
        />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
