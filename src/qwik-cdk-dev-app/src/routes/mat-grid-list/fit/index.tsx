import {component$} from '@qwik.dev/core';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <div data-parity-root>
      <div style={{height: '400px'}} class="fit-host">
        <MatGridList cols={4} rowHeight="fit" class="fit-grid">
          <MatGridTile>Fit 1</MatGridTile>
          <MatGridTile>Fit 2</MatGridTile>
          <MatGridTile>Fit 3</MatGridTile>
          <MatGridTile>Fit 4</MatGridTile>
          <MatGridTile>Fit 5</MatGridTile>
          <MatGridTile>Fit 6</MatGridTile>
          <MatGridTile>Fit 7</MatGridTile>
          <MatGridTile>Fit 8</MatGridTile>
        </MatGridList>
      </div>
    </div>
    {/* Qwik SSR HTML-escapes text content inside <style> (">" becomes
         "&gt;"), which breaks a child-combinator selector when the browser
         parses it. A descendant selector sidesteps the escaping entirely
         and is equivalent here (.fit-grid is .fit-host's only descendant
         with that class). */}
    <style>{`.fit-host .fit-grid { height: 100%; } mat-grid-tile { background: lightblue; }`}</style>
    <main data-scenario-ready>ready</main>
  </>
));
