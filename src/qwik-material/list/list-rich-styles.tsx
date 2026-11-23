import {component$, type JSXOutput} from '@qwik.dev/core';
import {markSheetPlaced, sheetToPlace} from '../core/ssr-sheets';
import {useMatListStyles} from './list-styles';

/**
 * Registers the list's `rich` sheet (with the base) where it renders: an item's or a section's
 * last child during server rendering (core/ssr-sheets.ts). Its own component, so the sheet takes
 * the same hook position — the same `<style>` — as everywhere else. Renders nothing.
 */
export const ListRichStyles = component$(() => {
  useMatListStyles('rich');
  markSheetPlaced('list:rich');
  return null;
});

/** An item's or section's last child (see core/ssr-sheets.ts): during server rendering, the `rich` sheet the first time. */
export function listRichSheet(): JSXOutput {
  return sheetToPlace('list:rich') ? <ListRichStyles /> : null;
}
