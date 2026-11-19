// qwik-cdk's CSS goes in the `qwik-cdk` cascade layer, declared BELOW qwik-material's:
//
//   @layer qwik-cdk, qwik-material;
//
// qwik-material ships every stylesheet (its global core and each component's, which components
// register with `useStyles$` on first render — qwik-material README "Component styles") inside
// `@layer qwik-material`, so that an app's unlayered CSS always beats it. qwik-material's rules
// also style CDK elements over the CDK's own (e.g. dialog.css's `.cdk-overlay-pane.mat-mdc-dialog-panel
// { max-width: 560px }` over the overlay's `.cdk-overlay-pane { max-width: 100% }`), which plain
// source order used to settle (the CDK's CSS loaded first). Left unlayered, the CDK's CSS would beat
// any layered rule; in a layer ordered first, material beats the CDK again and the app beats both.
// Every stylesheet that uses either layer starts with the order statement, so the order holds
// whichever loads first (an order statement repeating an established order changes nothing).

/** The layer order statement, identical in qwik-material's stylesheets. */
export const LAYER_ORDER = '@layer qwik-cdk, qwik-material;';

/** `css` inside `@layer qwik-cdk { … }`, after the order statement. */
export function wrapInCdkLayer(css) {
  if (/@charset|@import/.test(css)) {
    throw new Error('qwik-cdk: compiled CSS has a @charset/@import that cannot be layered');
  }
  return `${LAYER_ORDER}\n@layer qwik-cdk {\n${css.trimEnd()}\n}\n`;
}
