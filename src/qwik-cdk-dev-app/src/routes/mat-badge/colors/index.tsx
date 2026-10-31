import {component$} from '@builder.io/qwik';
import {useMatBadge} from '@angular-community/qwik-material/badge';
import {MatButton} from '@angular-community/qwik-material/button';

// See basic/index.tsx's header comment — real Material buttons via
// useMatBadge(), plus margin-right so the `above after`-positioned badge
// (which overflows past its own button's right edge) doesn't visually
// collide with the next button.
export default component$(() => {
  const primary = useMatBadge({content: '3', color: 'primary'});
  const accent = useMatBadge({content: '7', color: 'accent'});
  const warn = useMatBadge({content: '9', color: 'warn'});
  return (
    <>
      <div data-parity-root>
        <MatButton
          appearance="elevated"
          style="margin-right: 16px"
          {...primary.hostProps}
          hostContent={primary.content}
        >
          Primary
        </MatButton>
        <MatButton
          appearance="elevated"
          style="margin-right: 16px"
          {...accent.hostProps}
          hostContent={accent.content}
        >
          Accent
        </MatButton>
        <MatButton appearance="elevated" {...warn.hostProps} hostContent={warn.content}>
          Warn
        </MatButton>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
