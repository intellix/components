import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

const HOME_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 8h-3v9h-4v-6H10v6H6v-9H3z"/></svg>`;

export default component$(() => (
  <>
    <MatIcon svgLiteral={HOME_SVG} />
    <main data-scenario-ready>ready</main>
  </>
));
