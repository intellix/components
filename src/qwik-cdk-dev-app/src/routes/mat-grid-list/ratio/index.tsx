import {component$} from '@qwik.dev/core';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatGridList cols={3} rowHeight="4:3">
        <MatGridTile>Ratio 1</MatGridTile>
        <MatGridTile>Ratio 2</MatGridTile>
        <MatGridTile>Ratio 3</MatGridTile>
        <MatGridTile>Ratio 4</MatGridTile>
        <MatGridTile>Ratio 5</MatGridTile>
        <MatGridTile>Ratio 6</MatGridTile>
      </MatGridList>
    </div>
    {/* See ../basic/index.tsx's header comment. */}
    <style>{`mat-grid-tile { background: lightblue; }`}</style>
    <main data-scenario-ready>ready</main>
  </>
));
