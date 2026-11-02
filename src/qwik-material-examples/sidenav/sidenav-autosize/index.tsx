import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';
import {MatButton} from '@angular-community/qwik-material/button';
import './sidenav-autosize-example.css';

// Qwik port of material.angular.dev's `sidenav-autosize` docs example. Rendered unmodified by the
// Angular dev-app at /qwik-parity/examples/sidenav-autosize. `drawer.toggle()` becomes flipping a
// local `opened` signal directly, same precedent as
// src/qwik-cdk-dev-app/src/routes/mat-sidenav/disable-close/index.tsx.

export default component$(() => {
  const showFiller = useSignal(false);
  const opened = useSignal(false);

  return (
    <sidenav-autosize-example>
      <MatDrawerContainer class="example-container" autosize>
        <MatDrawer
          q:slot="start-drawer"
          class="example-sidenav"
          mode="side"
          opened={opened.value}
          onOpenedChange$={$((v: boolean) => {
            opened.value = v;
          })}
        >
          <p>Auto-resizing sidenav</p>
          {showFiller.value && <p>Lorem, ipsum dolor sit amet consectetur.</p>}
          <MatButton
            appearance="elevated"
            onClick$={$(() => {
              showFiller.value = !showFiller.value;
            })}
          >
            Toggle extra text
          </MatButton>
        </MatDrawer>
        {/* Upstream's template has no explicit <mat-drawer-content> either — Angular implicitly
            wraps every non-drawer child in one (sidenav.md's "Specifying the main and side
            content"). This port has no such auto-wrap, so it's explicit here instead. */}
        <MatDrawerContent>
          <div class="example-sidenav-content">
            <MatButton
              type="button"
              onClick$={$(() => {
                opened.value = !opened.value;
              })}
            >
              Toggle sidenav
            </MatButton>
          </div>
        </MatDrawerContent>
      </MatDrawerContainer>
    </sidenav-autosize-example>
  );
});
