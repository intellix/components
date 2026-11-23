import {useServerData} from '@qwik.dev/core';
import {isServer} from '@qwik.dev/core/build';

/**
 * Where a component's VARIANT stylesheet (`COMPONENT_STYLE_VARIANTS`: a button appearance, the
 * list's `rich` sheet, the badge's `content`) goes in server-rendered HTML.
 *
 * Server rendering writes a `useStyles$` `<style>` where the registering component renders: a
 * component's hook places it just BEFORE the component's host. Its base sheet only ever lands
 * before the entry's first instance, but a variant sheet would land before the first instance of
 * each variant — between two sibling buttons of a dialog's actions, say, where it breaks
 * `.mat-mdc-dialog-actions .mat-mdc-button-base+.mat-mdc-button-base` and shifts `:nth-child()`
 * until Qwik moves the `<style>`s into `<head>` on resume. So during server rendering the component
 * registers only its base sheet itself, and the first instance of each variant renders a small
 * registering component as its host's LAST CHILD: the `<style>` lands inside that host, after
 * its content (Qwik skips it when it builds vnodes from the DOM, and moves it into `<head>` on
 * resume). Last, because the browser's render of that host has no such child: removing a trailing
 * one leaves every other child in place, where a leading one made Qwik re-create the children
 * after it (behind the ripple element the delegate had appended). That component calls the entry's
 * hook too, so the sheet takes the same hook position — the same `<style>` id — as a registration
 * in the browser, which dedupes against it.
 *
 * In the browser (or with no server render under way) the component's own hook registers its
 * variants, appended to `<head>`.
 */

/** Per server render (its container attributes object): the variant sheets placed so far. */
const placed = new WeakMap<object, Set<string>>();

/** The server render under way, or `undefined` in the browser. Not a hook: no hook position. */
function serverRender(): object | undefined {
  return isServer ? useServerData<object>('containerAttributes') : undefined;
}

/** Whether a server render is under way: its components register only their base sheets. */
export function serverRendering(): boolean {
  return serverRender() !== undefined;
}

/**
 * During server rendering, whether the variant sheet `key` (`<entry>:<variant>`) still needs its
 * registering component: no instance has placed it yet. Always `false` in the browser.
 */
export function sheetToPlace(key: string): boolean {
  const render = serverRender();
  return !!render && !placed.get(render)?.has(key);
}

/** Records, from the registering component's render, that this server render placed `key`. */
export function markSheetPlaced(key: string): void {
  const render = serverRender();
  if (!render) return;
  let keys = placed.get(render);
  if (!keys) placed.set(render, (keys = new Set()));
  keys.add(key);
}
