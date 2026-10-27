import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

const CAKE_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6a2 2 0 100-4 2 2 0 000 4z"/></svg>`;

export default component$(() => (
  <>
    <div data-parity-root>
      <MatIcon svgLiteral={CAKE_SVG} svgName="cake" svgNamespace="social" />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
