import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import * as sass from 'sass';
import {describe, expect, it} from 'vitest';
import {LAYER_ORDER, wrapInCdkLayer} from './scripts/css-layer.mjs';

/**
 * Every stylesheet qwik-cdk ships sits in `@layer qwik-cdk`, ordered below qwik-material's layer
 * (scripts/css-layer.mjs): the prebuilts (wrapped by the build) and the stylesheets components
 * import themselves (`<QwikCdkRoot>`'s overlay structure, `CdkDialogContainer`'s).
 */
const scss = join(import.meta.dirname, 'scss');
const compile = (file: string) => sass.compile(join(scss, file), {style: 'expanded'}).css;

describe('qwik-cdk cascade layer', () => {
  it.each([
    'overlay/overlay-prebuilt.scss',
    'a11y/a11y-prebuilt.scss',
    'text-field/text-field-prebuilt.scss',
  ])('%s ships inside @layer qwik-cdk, after the order statement', file => {
    const css = wrapInCdkLayer(compile(file));
    expect(css.startsWith(`${LAYER_ORDER}\n@layer qwik-cdk {\n`)).toBe(true);
    expect(css.endsWith('\n}\n')).toBe(true);
  });

  it.each([
    ['root.tsx', 'overlay/overlay-structure-layered.scss', 'overlay/overlay-structure.scss'],
    [
      'dialog/dialog-container.tsx',
      'dialog/dialog-container-layered.scss',
      'dialog/dialog-container.scss',
    ],
  ])('%s imports %s: %s inside @layer qwik-cdk', (component, layered, synced) => {
    expect(readFileSync(join(scss, '..', component), 'utf8')).toContain(`scss/${layered}'`);
    const css = compile(layered);
    expect(css.startsWith(`${LAYER_ORDER}\n@layer qwik-cdk {\n`)).toBe(true);
    // Every rule of the synced stylesheet, nested one level deeper.
    const inner = css.slice(css.indexOf('{') + 1, css.lastIndexOf('}'));
    expect(inner.replace(/\s+/g, '')).toBe(compile(synced).replace(/\s+/g, ''));
  });

  it('the order statement matches qwik-material', () => {
    const material = readFileSync(
      join(scss, '../../qwik-material/scripts/component-styles.mjs'),
      'utf8',
    );
    expect(material).toContain(`'${LAYER_ORDER}'`);
  });
});
