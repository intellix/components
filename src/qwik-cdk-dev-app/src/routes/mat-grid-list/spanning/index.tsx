import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
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
    <main data-scenario-ready>ready</main>
  </>
));
