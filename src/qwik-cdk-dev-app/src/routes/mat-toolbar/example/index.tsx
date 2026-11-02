import {component$, useStyles$} from '@qwik.dev/core';
import {MatToolbar} from '@angular-community/qwik-material/toolbar';
import {MatIconButton} from '@angular-community/qwik-material/button';
import {MatIcon} from '@angular-community/qwik-material/icon';
import styles from './example.css?inline';

// Port of src/components-examples/material/toolbar/toolbar-overview
// (toolbar-overview-example.html/.ts/.css) — material.angular.dev's
// "Toolbar overview" example.
export default component$(() => {
  useStyles$(styles);

  return (
    <>
      <div data-parity-root>
        <toolbar-overview-example>
          <MatToolbar>
            <MatIconButton class="example-icon" ariaLabel="Example icon-button with menu icon">
              <MatIcon>menu</MatIcon>
            </MatIconButton>
            <span>My App</span>
            <span class="example-spacer"></span>
            <MatIconButton
              class="example-icon favorite-icon"
              ariaLabel="Example icon-button with heart icon"
            >
              <MatIcon>favorite</MatIcon>
            </MatIconButton>
            <MatIconButton class="example-icon" ariaLabel="Example icon-button with share icon">
              <MatIcon>share</MatIcon>
            </MatIconButton>
          </MatToolbar>
        </toolbar-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
