import {component$} from '@qwik.dev/core';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';
import './sidenav-drawer-overview-example.css';

// Qwik port of material.angular.dev's `sidenav-drawer-overview` docs example — see
// src/components-examples/material/sidenav/sidenav-drawer-overview/
// sidenav-drawer-overview-example.{ts,html,css}. Rendered unmodified by the Angular dev-app at
// /qwik-parity/examples/sidenav-drawer-overview (the generic `examples/:exampleId` route). Host
// tag mirrors the example's own component selector (`sidenav-drawer-overview-example`).

export default component$(() => (
  <sidenav-drawer-overview-example>
    <MatDrawerContainer class="example-container">
      <MatDrawer q:slot="start-drawer" mode="side" opened>
        Drawer content
      </MatDrawer>
      <MatDrawerContent>Main content</MatDrawerContent>
    </MatDrawerContainer>
  </sidenav-drawer-overview-example>
));
