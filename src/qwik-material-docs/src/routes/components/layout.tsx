import {component$, Slot, useSignal} from '@qwik.dev/core';
import {
  MatDrawerContainer,
  MatDrawer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';
import {MatIconButton} from '@angular-community/qwik-material/button';
import {MatIcon} from '@angular-community/qwik-material/icon';
import {useIsScreenSmall} from '../../hooks/use-is-screen-small';
import ComponentNav from '../../components/component-nav';

/**
 * Wraps every `/components/*` page in the responsive component index — dogfoods
 * `<MatDrawerContainer>`/`<MatDrawer>` (`mode="side"`, always open, on wide screens;
 * `mode="over"`, toggled by the "Browse components" button, on narrow ones), the same shape
 * material.angular.dev's own `component-sidenav` uses.
 */
export default component$(() => {
  const isSmall = useIsScreenSmall();
  const opened = useSignal(false);

  return (
    <MatDrawerContainer class="docs-shell-sidenav-container" hasBackdrop={isSmall.value}>
      <MatDrawer
        mode={isSmall.value ? 'over' : 'side'}
        opened={!isSmall.value || opened.value}
        onOpenedChange$={value => (opened.value = value)}
      >
        <ComponentNav />
      </MatDrawer>
      <MatDrawerContent>
        {isSmall.value && (
          <div class="docs-subheader">
            <MatIconButton ariaLabel="Browse components" onClick$={() => (opened.value = true)}>
              <MatIcon>menu</MatIcon>
            </MatIconButton>
            <span>Components</span>
          </div>
        )}
        <div class="docs-shell-content">
          <Slot />
        </div>
      </MatDrawerContent>
    </MatDrawerContainer>
  );
});
