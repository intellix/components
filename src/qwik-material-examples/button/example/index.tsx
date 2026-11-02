import {component$, useStyles$} from '@qwik.dev/core';
import {
  MatButton,
  MatIconButton,
  MatFabButton,
  MatMiniFabButton,
} from '@angular-community/qwik-material/button';
import {MatDivider} from '@angular-community/qwik-material/divider';
import {MatIcon} from '@angular-community/qwik-material/icon';
import styles from './example.css?inline';

// Port of src/components-examples/material/button/button-overview
// (button-overview-example.html/.ts/.css) — material.angular.dev's "Button
// overview" example. `<a matFab extended routerLink=".">` becomes
// `href="."` — same target page, no Angular Router in this app. The
// `target="_blank"` links required adding a `target` prop to `MatButton`
// (qwik-material/button/mat-button.tsx — see its SYNC.md), a small,
// upstream-aligned gap: the `<a>` host never forwarded any native anchor
// attribute beyond `href`.

export default component$(() => {
  useStyles$(styles);

  return (
    <button-overview-example>
      <section>
        <div class="example-label">Text</div>
        <div class="example-button-row">
          <MatButton>Basic</MatButton>
          <MatButton disabled>Disabled</MatButton>
          <MatButton href="https://www.google.com/" target="_blank">
            Link
          </MatButton>
        </div>
      </section>
      <MatDivider />
      <section>
        <div class="example-label">Elevated</div>
        <div class="example-button-row">
          <MatButton appearance="elevated">Basic</MatButton>
          <MatButton appearance="elevated" disabled>
            Disabled
          </MatButton>
          <MatButton appearance="elevated" href="https://www.google.com/" target="_blank">
            Link
          </MatButton>
        </div>
      </section>
      <MatDivider />
      <section>
        <div class="example-label">Outlined</div>
        <div class="example-button-row">
          <MatButton appearance="outlined">Basic</MatButton>
          <MatButton appearance="outlined" disabled>
            Disabled
          </MatButton>
          <MatButton appearance="outlined" href="https://www.google.com/" target="_blank">
            Link
          </MatButton>
        </div>
      </section>
      <MatDivider />
      <section>
        <div class="example-label">Filled</div>
        <div class="example-button-row">
          <MatButton appearance="filled">Basic</MatButton>
          <MatButton appearance="filled" disabled>
            Disabled
          </MatButton>
          <MatButton appearance="filled" href="https://www.google.com/" target="_blank">
            Link
          </MatButton>
        </div>
      </section>
      <MatDivider />
      <section>
        <div class="example-label">Tonal</div>
        <div class="example-button-row">
          <MatButton appearance="tonal">Basic</MatButton>
          <MatButton appearance="tonal" disabled>
            Disabled
          </MatButton>
          <MatButton appearance="tonal" href="https://www.google.com/" target="_blank">
            Link
          </MatButton>
        </div>
      </section>
      <MatDivider />
      <section>
        <div class="example-label">Icon</div>
        <div class="example-button-row">
          <div class="example-flex-container">
            <MatIconButton ariaLabel="Example icon button with a vertical three dot icon">
              <MatIcon>more_vert</MatIcon>
            </MatIconButton>
            <MatIconButton disabled ariaLabel="Example icon button with a open in new tab icon">
              <MatIcon>open_in_new</MatIcon>
            </MatIconButton>
          </div>
        </div>
      </section>
      <MatDivider />
      <section>
        <div class="example-label">Floating Action Button (FAB)</div>
        <div class="example-button-row">
          <div class="example-flex-container">
            <MatFabButton
              ariaLabel="Example icon button with a delete icon"
              icon={<MatIcon>delete</MatIcon>}
            />
            <MatFabButton
              disabled
              ariaLabel="Example icon button with a heart icon"
              icon={<MatIcon>favorite</MatIcon>}
            />
          </div>
        </div>
      </section>
      <MatDivider />
      <section>
        <div class="example-label">Mini FAB</div>
        <div class="example-button-row">
          <div class="example-flex-container">
            <MatMiniFabButton
              ariaLabel="Example icon button with a menu icon"
              icon={<MatIcon>menu</MatIcon>}
            />
            <MatMiniFabButton
              disabled
              ariaLabel="Example icon button with a home icon"
              icon={<MatIcon>home</MatIcon>}
            />
          </div>
        </div>
      </section>
      <MatDivider />
      <section>
        <div class="example-label">Extended FAB</div>
        <div class="example-button-row">
          <div class="example-flex-container">
            <MatFabButton extended icon={<MatIcon>favorite</MatIcon>}>
              Basic
            </MatFabButton>
            <MatFabButton extended disabled icon={<MatIcon>favorite</MatIcon>}>
              Disabled
            </MatFabButton>
            <MatFabButton extended href="." icon={<MatIcon>favorite</MatIcon>}>
              Link
            </MatFabButton>
          </div>
        </div>
      </section>
    </button-overview-example>
  );
});
