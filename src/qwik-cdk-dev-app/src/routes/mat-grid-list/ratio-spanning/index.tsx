import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatGridList cols={4} rowHeight="4:3">
        <MatGridTile rowspan={2} colspan={2}>
          Compound aspect 8:6
        </MatGridTile>
        <MatGridTile>Ratio fill 1</MatGridTile>
        <MatGridTile>Ratio fill 2</MatGridTile>
      </MatGridList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
