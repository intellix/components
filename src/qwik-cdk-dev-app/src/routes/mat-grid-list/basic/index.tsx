import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatGridList cols={4} rowHeight="100px">
        <MatGridTile>Tile 1</MatGridTile>
        <MatGridTile>Tile 2</MatGridTile>
        <MatGridTile>Tile 3</MatGridTile>
        <MatGridTile>Tile 4</MatGridTile>
        <MatGridTile>Tile 5</MatGridTile>
        <MatGridTile>Tile 6</MatGridTile>
        <MatGridTile>Tile 7</MatGridTile>
        <MatGridTile>Tile 8</MatGridTile>
      </MatGridList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
