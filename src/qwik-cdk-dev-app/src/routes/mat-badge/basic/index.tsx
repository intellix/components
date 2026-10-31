import {component$} from '@builder.io/qwik';
import {useMatBadge} from '@angular-community/qwik-material/badge';
import {MatButton} from '@angular-community/qwik-material/button';

// Real Material button host (`appearance="elevated"`, matching
// badge-overview-example.html's `<button matButton="elevated" matBadge="8">`)
// composed via the `useMatBadge()` directive hook — previously `<MatBadge
// as="button">` rendered a bare unstyled native button, which looked like a
// placeholder next to the docs example. See EXAMPLES.md "Scenario visual
// cleanup" / mat-badge.
export default component$(() => {
  const badge = useMatBadge({content: '5'});
  return (
    <>
      <div data-parity-root>
        <MatButton appearance="elevated" {...badge.hostProps} hostContent={badge.content}>
          Notifications
        </MatButton>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
