import {component$} from '@builder.io/qwik';
import {useMatBadge} from '@angular-community/qwik-material/badge';
import {MatButton} from '@angular-community/qwik-material/button';

// See ../basic/index.tsx's header comment — the margin-right fix matters
// MOST here: all 4 positions default to `overlap`, so each badge sits right
// at (or past) its own button's edge, and without spacing it visibly landed
// on top of the next button.
export default component$(() => {
  const aboveAfter = useMatBadge({content: '1', position: 'above after'});
  const aboveBefore = useMatBadge({content: '2', position: 'above before'});
  const belowAfter = useMatBadge({content: '3', position: 'below after'});
  const belowBefore = useMatBadge({content: '4', position: 'below before'});
  return (
    <>
      <div data-parity-root>
        <MatButton
          appearance="elevated"
          style="margin-right: 16px"
          {...aboveAfter.hostProps}
          hostContent={aboveAfter.content}
        >
          Above-After
        </MatButton>
        <MatButton
          appearance="elevated"
          style="margin-right: 16px"
          {...aboveBefore.hostProps}
          hostContent={aboveBefore.content}
        >
          Above-Before
        </MatButton>
        <MatButton
          appearance="elevated"
          style="margin-right: 16px"
          {...belowAfter.hostProps}
          hostContent={belowAfter.content}
        >
          Below-After
        </MatButton>
        <MatButton
          appearance="elevated"
          {...belowBefore.hostProps}
          hostContent={belowBefore.content}
        >
          Below-Before
        </MatButton>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
