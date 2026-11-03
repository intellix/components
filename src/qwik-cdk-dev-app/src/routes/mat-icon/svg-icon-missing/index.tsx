import {component$} from '@qwik.dev/core';
import {MatIcon, MatIconRegistryProvider} from '@angular-community/qwik-material/icon';

/**
 * `svgIcon` names an icon that was never registered — `getNamedSvgIcon`
 * rejects, `<MatIcon>` logs via `console.error` and renders nothing
 * (mirrors upstream's failure path; see mat-icon.tsx's `resolvedSvgIcon`).
 */
export default component$(() => {
  return (
    <>
      <div data-parity-root>
        <MatIconRegistryProvider>
          <MatIcon svgIcon="does-not-exist" aria-label="Missing" aria-hidden={false} />
        </MatIconRegistryProvider>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
