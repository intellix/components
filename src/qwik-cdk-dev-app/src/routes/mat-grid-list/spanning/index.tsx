import {component$} from '@qwik.dev/core';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatGridList cols={4} rowHeight="100px">
        <MatGridTile rowspan={2} colspan={2}>
          Hero
        </MatGridTile>
        <MatGridTile>Fill 1</MatGridTile>
        <MatGridTile>Fill 2</MatGridTile>
        <MatGridTile>Fill 3</MatGridTile>
        <MatGridTile>Fill 4</MatGridTile>
        <MatGridTile>Fill 5</MatGridTile>
        <MatGridTile>Fill 6</MatGridTile>
      </MatGridList>
    </div>
    {/* See ../basic/index.tsx's header comment. */}
    <style>{`mat-grid-tile { background: lightblue; }`}</style>
    <main data-scenario-ready>ready</main>
  </>
));
