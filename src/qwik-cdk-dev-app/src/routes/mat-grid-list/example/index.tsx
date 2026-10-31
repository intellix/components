import {component$, useStyles$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';
import styles from './example.css?inline';

// Port of src/components-examples/material/grid-list/grid-list-overview
// (grid-list-overview-example.html/.ts/.css) — material.angular.dev's
// "Basic grid-list" example.
export default component$(() => {
  useStyles$(styles);

  return (
    <>
      <div data-parity-root>
        <grid-list-overview-example>
          <MatGridList cols={2} rowHeight="2:1">
            <MatGridTile>1</MatGridTile>
            <MatGridTile>2</MatGridTile>
            <MatGridTile>3</MatGridTile>
            <MatGridTile>4</MatGridTile>
          </MatGridList>
        </grid-list-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
