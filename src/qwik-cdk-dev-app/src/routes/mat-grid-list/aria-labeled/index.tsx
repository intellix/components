import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <MatGridList cols={3} rowHeight="100px" role="list" aria-label="Photo grid">
      <MatGridTile role="listitem" aria-label="Photo 1">
        Photo 1
      </MatGridTile>
      <MatGridTile role="listitem" aria-label="Photo 2">
        Photo 2
      </MatGridTile>
      <MatGridTile role="listitem" aria-label="Photo 3">
        Photo 3
      </MatGridTile>
    </MatGridList>
    <main data-scenario-ready>ready</main>
  </>
));
