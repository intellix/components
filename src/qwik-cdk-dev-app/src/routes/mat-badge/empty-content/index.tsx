import {component$} from '@qwik.dev/core';
import {useMatBadge} from '@angular-community/qwik-material/badge';
import {MatButton} from '@angular-community/qwik-material/button';

// See ../basic/index.tsx's header comment.
export default component$(() => {
  const empty = useMatBadge({content: ''});
  const whitespace = useMatBadge({content: ' '});
  const zero = useMatBadge({content: 0});
  return (
    <>
      <div data-parity-root>
        <MatButton
          appearance="elevated"
          style="margin-right: 16px"
          {...empty.hostProps}
          hostContent={empty.content}
        >
          Empty
        </MatButton>
        <MatButton
          appearance="elevated"
          style="margin-right: 16px"
          {...whitespace.hostProps}
          hostContent={whitespace.content}
        >
          Whitespace
        </MatButton>
        <MatButton appearance="elevated" {...zero.hostProps} hostContent={zero.content}>
          Zero
        </MatButton>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
