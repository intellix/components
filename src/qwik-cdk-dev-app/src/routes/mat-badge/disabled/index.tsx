import {component$} from '@builder.io/qwik';
import {useMatBadge} from '@angular-community/qwik-material/badge';
import {MatButton} from '@angular-community/qwik-material/button';

// See ../basic/index.tsx's header comment. `matBadgeDisabled` is a purely
// visual class on the BADGE itself (upstream), independent of the button's
// own native disabled state — MatButton itself stays enabled.
export default component$(() => {
  const badge = useMatBadge({content: '5', disabled: true});
  return (
    <>
      <div data-parity-root>
        <MatButton appearance="elevated" {...badge.hostProps} hostContent={badge.content}>
          Alerts
        </MatButton>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
