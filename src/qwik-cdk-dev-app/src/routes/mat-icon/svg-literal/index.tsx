import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

const HOME_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 8h-3v9h-4v-6H10v6H6v-9H3z"/></svg>`;

// The Angular mirror (src/dev-app/qwik-parity/icon.ts IconSvgLiteral) registers
// this literal under the name 'home' via
// `iconRegistry.addSvgIconLiteral('home', ...)`, which upstream's MatIcon
// surfaces as `data-mat-icon-name="home"`. Pass the matching `svgName` here so
// the Qwik scenario reproduces that registration instead of an anonymous one.
export default component$(() => (
  <>
    <div data-parity-root>
      <MatIcon svgLiteral={HOME_SVG} svgName="home" />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
