import {component$} from '@qwik.dev/core';
import {useMatBadge} from '@angular-community/qwik-material/badge';
import {MatButton} from '@angular-community/qwik-material/button';

// See ../basic/index.tsx's header comment.
export default component$(() => {
  const badge = useMatBadge({content: '9', overlap: false});
  return (
    <>
      <div data-parity-root>
        <MatButton appearance="elevated" {...badge.hostProps} hostContent={badge.content}>
          Cart
        </MatButton>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
