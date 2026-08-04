import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <MatGridList cols={3} rowHeight="4:3">
      <MatGridTile>Ratio 1</MatGridTile>
      <MatGridTile>Ratio 2</MatGridTile>
      <MatGridTile>Ratio 3</MatGridTile>
      <MatGridTile>Ratio 4</MatGridTile>
      <MatGridTile>Ratio 5</MatGridTile>
      <MatGridTile>Ratio 6</MatGridTile>
    </MatGridList>
    <main data-scenario-ready>ready</main>
  </>
));
