import {component$} from '@qwik.dev/core';
import {useMatBadge} from '@angular-community/qwik-material/badge';
import {MatButton} from '@angular-community/qwik-material/button';

// See ../basic/index.tsx's header comment.
export default component$(() => {
  const badge = useMatBadge({content: '5', description: '3 unread messages'});
  return (
    <>
      <div data-parity-root>
        <MatButton appearance="elevated" {...badge.hostProps} hostContent={badge.content}>
          Messages
        </MatButton>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
