import {component$, type JSXOutput} from '@qwik.dev/core';
import {markSheetPlaced, sheetToPlace} from '../../core/ssr-sheets';
import {type MatButtonStyleVariant, useMatButtonStyles} from '../button-styles';

/**
 * Registers a button variant's sheet (with the base) where it renders: a host's last child
 * during server rendering (core/ssr-sheets.ts), or beside a `MatButton` whose appearance is the
 * `MAT_BUTTON_CONFIG` default — read after its first hook, so not among its hook's variants. Its
 * own component, so the sheet takes the same hook position — the same `<style>` — as everywhere
 * else. Renders nothing.
 */
export const ButtonVariantStyles = component$<{variant: MatButtonStyleVariant}>(props => {
  useMatButtonStyles(props.variant);
  markSheetPlaced(`button:${props.variant}`);
  return null;
});

/**
 * A button host's LAST child (after everything Qwik renders in it): during server rendering, its
 * variant's sheet the first time. Last, so the browser's render — which has none — leaves every
 * other child in place.
 */
export function buttonVariantSheet(variant: MatButtonStyleVariant): JSXOutput {
  return sheetToPlace(`button:${variant}`) ? <ButtonVariantStyles variant={variant} /> : null;
}
