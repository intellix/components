import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatGridList cols={3} rowHeight="100px" gutterSize="16px">
        <MatGridTile>Gutter 1</MatGridTile>
        <MatGridTile>Gutter 2</MatGridTile>
        <MatGridTile>Gutter 3</MatGridTile>
        <MatGridTile>Gutter 4</MatGridTile>
        <MatGridTile>Gutter 5</MatGridTile>
        <MatGridTile>Gutter 6</MatGridTile>
      </MatGridList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
