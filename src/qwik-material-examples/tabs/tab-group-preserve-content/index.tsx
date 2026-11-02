import {$, component$, useSignal} from '@qwik.dev/core';
import {MatTabGroup} from '@angular-community/qwik-material/tabs';

// Qwik port of material.angular.dev's `tab-group-preserve-content` docs example. Rendered
// unmodified by the Angular dev-app at /qwik-parity/examples/tab-group-preserve-content. No
// `[(selectedIndex)]` binding upstream either -- a local signal keeps `<MatTabGroup>`'s
// controlled-component contract satisfied (see tab-group-custom-label/index.tsx's identical note).

export default component$(() => {
  const selected = useSignal(0);

  return (
    <tab-group-preserve-content-example>
      <p>Start the video in the first tab and navigate to the second one to see how it keeps playing.</p>
      <MatTabGroup
        preserveContent
        selectedIndex={selected.value}
        onSelectedIndexChange$={$((i: number) => {
          selected.value = i;
        })}
        tabs={[
          {
            label: 'First',
            content: (
              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/B-lipaiZII8"
                style="border: 0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullscreen
              />
            ),
          },
          {
            label: 'Second',
            content: 'Note how the video from the previous tab is still playing.',
          },
        ]}
      />
    </tab-group-preserve-content-example>
  );
});
