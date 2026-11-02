import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
  type MatDrawerMode,
} from '@angular-community/qwik-material/sidenav';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';
import {MatButton} from '@angular-community/qwik-material/button';
import './sidenav-backdrop-example.css';

// Qwik port of material.angular.dev's `sidenav-backdrop` docs example — see
// src/components-examples/material/sidenav/sidenav-backdrop/sidenav-backdrop-example.{ts,html,css}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/examples/sidenav-backdrop (the
// generic `examples/:exampleId` route). Host tag mirrors the example's own component selector.
//
// Upstream reads `mode.value`/`hasBackdrop.value` directly off its two `<mat-select>` template
// references (no `[(ngModel)]`) — this port owns the same state as two local signals instead,
// wired via `onValueChange$`. `drawer.toggle()` becomes flipping the `opened` signal directly
// (see src/qwik-cdk-dev-app/src/routes/mat-sidenav/disable-close/index.tsx's identical note).
// The "hasBackdrop" select's `undefined` ("Unset") option maps to `MatDrawerContainer`'s own
// `hasBackdrop` prop being omitted (its documented default: backdrop for over/push, none for side).

export default component$(() => {
  const mode = useSignal<MatDrawerMode>('side');
  const hasBackdrop = useSignal<boolean | undefined>(undefined);
  const opened = useSignal(false);

  return (
    <sidenav-backdrop-example>
      <MatDrawerContainer class="example-container" hasBackdrop={hasBackdrop.value}>
        <MatDrawer q:slot="start-drawer" mode={mode.value} opened={opened.value}
          onOpenedChange$={$((v: boolean) => {
            opened.value = v;
          })}
        >
          I'm a drawer
        </MatDrawer>
        <MatDrawerContent>
          <MatFormField
            label={<MatLabel>Sidenav mode</MatLabel>}
            control={
              <MatSelect
                controlType="mat-select"
                value={mode.value}
                onValueChange$={$((v: MatDrawerMode) => {
                  mode.value = v;
                })}
                options={[
                  {value: 'side', label: 'Side', echoValueAttr: false},
                  {value: 'over', label: 'Over', echoValueAttr: false},
                  {value: 'push', label: 'Push', echoValueAttr: false},
                ]}
              />
            }
          />
          <MatFormField
            label={<MatLabel>Has backdrop</MatLabel>}
            control={
              <MatSelect
                controlType="mat-select"
                value={hasBackdrop.value}
                onValueChange$={$((v: boolean | undefined) => {
                  hasBackdrop.value = v;
                })}
                options={[
                  {label: 'Unset'},
                  {value: true, label: 'True', echoValueAttr: false},
                  {value: false, label: 'False', echoValueAttr: false},
                ]}
              />
            }
          />
          <MatButton
            appearance="elevated"
            onClick$={$(() => {
              opened.value = !opened.value;
            })}
          >
            Toggle drawer
          </MatButton>
        </MatDrawerContent>
      </MatDrawerContainer>
    </sidenav-backdrop-example>
  );
});
