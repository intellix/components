import {component$} from '@builder.io/qwik';
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
    <style>{`.fit-host > .fit-grid { height: 100%; }`}</style>
    <main data-scenario-ready>ready</main>
  </>
));
