import {component$, useSignal} from '@qwik.dev/core';
import {
  MatIcon,
  trustIconHtml,
  useMatIconRegistryProvider,
} from '@angular-community/qwik-material/icon';
import {MatButton} from '@angular-community/qwik-material/button';

const STAR_ICON = trustIconHtml('<svg viewBox="0 0 24 24"><path d="M12 2l10 20H2z"/></svg>');
const HEART_ICON = trustIconHtml(
  '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5-8-12a4 4 0 0 1 8-2 4 4 0 0 1 8 2c0 7-8 12-8 12z"/></svg>',
);

/**
 * A button flips `svgIcon` between two registered names AFTER the page has
 * resumed (no SSR involved in the flip) — proves `useComputed$`'s
 * re-suspend-on-prop-change path actually re-resolves client-side, not just
 * once during SSR.
 */
export default component$(() => {
  const useHeart = useSignal(false);
  useMatIconRegistryProvider({
    icons: [
      {name: 'star', literal: STAR_ICON},
      {name: 'heart', literal: HEART_ICON},
    ],
  });
  return (
    <>
      <div data-parity-root>
        <>
          <MatIcon
            svgIcon={useHeart.value ? 'heart' : 'star'}
            aria-label="Toggle icon"
            aria-hidden={false}
          />
        </>
        <MatButton onClick$={() => (useHeart.value = !useHeart.value)}>Toggle</MatButton>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
