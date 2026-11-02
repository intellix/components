import {component$} from '@qwik.dev/core';
import {MatToolbar, MatToolbarRow} from '@angular-community/qwik-material/toolbar';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatIcon} from '@angular-community/qwik-material/icon';
import './toolbar-multirow-example.css';

// Qwik port of material.angular.dev's `toolbar-multirow` docs example — see
// src/components-examples/material/toolbar/toolbar-multirow/toolbar-multirow-example.{ts,html,css}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/examples/toolbar-multirow
// (src/dev-app/qwik-parity/examples.ts' generic `examples/:exampleId` route). Host tag mirrors the
// example's own component selector (`toolbar-multirow-example`).
//
// `multipleRows` is passed explicitly (see toolbar/SYNC.md deviation 1 — Qwik can't detect
// `<MatToolbarRow>` children at render time the way upstream's `@ContentChildren` does). The
// `<QwikMaterialProvider matIconConfig>` wrapper matches the Angular dev-app's own default icon
// font-set, confirmed live (same precedent as qwik-material-examples/tree/example/index.tsx).

export default component$(() => (
  <toolbar-multirow-example>
    <QwikMaterialProvider matIconConfig={{fontSet: 'material-symbols-outlined'}}>
      <MatToolbar multipleRows>
        <MatToolbarRow>
          <span>Custom Toolbar</span>
        </MatToolbarRow>
        <MatToolbarRow>
          <span>Second Line</span>
          <span class="example-spacer"></span>
          <MatIcon class="example-icon" aria-hidden={false} aria-label="Example user verified icon">
            verified_user
          </MatIcon>
        </MatToolbarRow>
        <MatToolbarRow>
          <span>Third Line</span>
          <span class="example-spacer"></span>
          <MatIcon class="example-icon" aria-hidden={false} aria-label="Example heart icon">
            favorite
          </MatIcon>
          <MatIcon class="example-icon" aria-hidden={false} aria-label="Example delete icon">
            delete
          </MatIcon>
        </MatToolbarRow>
      </MatToolbar>
    </QwikMaterialProvider>
  </toolbar-multirow-example>
));
