import {component$} from '@builder.io/qwik';
import {useMatBadge} from '@angular-community/qwik-material/badge';
import {MatButton} from '@angular-community/qwik-material/button';

// See ../basic/index.tsx's header comment.
export default component$(() => {
  const small = useMatBadge({content: '1', size: 'small'});
  const medium = useMatBadge({content: '5', size: 'medium'});
  const large = useMatBadge({content: '99', size: 'large'});
  return (
    <>
      <div data-parity-root>
        <MatButton
          appearance="elevated"
          style="margin-right: 16px"
          {...small.hostProps}
          hostContent={small.content}
        >
          Small
        </MatButton>
        <MatButton
          appearance="elevated"
          style="margin-right: 16px"
          {...medium.hostProps}
          hostContent={medium.content}
        >
          Medium
        </MatButton>
        <MatButton appearance="elevated" {...large.hostProps} hostContent={large.content}>
          Large
        </MatButton>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
