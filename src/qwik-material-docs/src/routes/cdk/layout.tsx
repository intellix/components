import {component$, Slot, useSignal} from '@qwik.dev/core';
import {
  MatDrawerContainer,
  MatDrawer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';
import {MatIconButton} from '@angular-community/qwik-material/button';
import {MatIcon} from '@angular-community/qwik-material/icon';
import {useIsScreenSmall} from '../../hooks/use-is-screen-small';
import CdkNav from '../../components/cdk-nav';

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
        <CdkNav />
      </MatDrawer>
      <MatDrawerContent>
        {isSmall.value && (
          <div class="docs-subheader">
            <MatIconButton ariaLabel="Browse CDK entry points" onClick$={() => (opened.value = true)}>
              <MatIcon>menu</MatIcon>
            </MatIconButton>
            <span>CDK</span>
          </div>
        )}
        <div class="docs-shell-content">
          <Slot />
        </div>
      </MatDrawerContent>
    </MatDrawerContainer>
  );
});
