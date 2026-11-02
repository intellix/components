# Theming

qwik-material ships Angular Material's M3 design tokens as plain CSS custom properties — there's
no Sass theming API (`mat.define-theme()`, mixins, …) to run at build time. Every component's
SCSS was ported verbatim and compiled once into the prebuilt CSS files you import (see
[Getting started](/guide/getting-started/)); theming means overriding CSS variables, not
recompiling Sass.

## The default theme

`core-prebuilt.css` sets every `--mat-sys-*` token at the `html` level:

```css
html {
  color-scheme: light dark;
  --mat-sys-primary: light-dark(#36618e, #a2c9fe);
  --mat-sys-on-primary: light-dark(#ffffff, #002f65);
  --mat-sys-surface: light-dark(#faf9fd, #121316);
  --mat-sys-on-surface: light-dark(#1a1b1f, #e3e2e6);
  /* ...and around 90 more: containers, outlines, typography scale, corner radii, elevation */
}
```

`light-dark()` is a plain CSS function: given `color-scheme: light dark`, the browser picks
whichever value matches the user's OS/browser preference, live, with zero JavaScript. This site
follows the exact same mechanism — there's no separate dark-mode stylesheet anywhere in
qwik-material.

Every component's CSS reads these tokens (`background: var(--mat-sys-surface)`,
`color: var(--mat-sys-on-surface-variant)`, …) instead of hardcoded colors, exactly mirroring how
`@angular/material`'s own M3 styles are written.

## Token categories

| Category | Examples | Used for |
|---|---|---|
| Color roles | `--mat-sys-primary`, `--mat-sys-on-primary`, `--mat-sys-primary-container`, `--mat-sys-secondary`, `--mat-sys-tertiary`, `--mat-sys-error` | Buttons, selection states, accents |
| Surfaces | `--mat-sys-surface`, `--mat-sys-surface-container(-low\|-high\|-highest)`, `--mat-sys-surface-variant` | Cards, menus, dialogs, form fields |
| Outlines | `--mat-sys-outline`, `--mat-sys-outline-variant` | Borders, dividers |
| Typography scale | `--mat-sys-body-large(-font\|-size\|-weight\|-line-height\|-tracking)`, same for `body-medium/small`, `title-*`, `headline-*`, `display-*`, `label-*` | Every component's text |
| Shape | `--mat-sys-corner-small/medium/large/…` | Border radii |

## Applying a brand theme

Override the tokens you care about at `:root` (or scope the override to a subtree, e.g. a
section of your app that should look different) — the same variable names, after your prebuilt
CSS imports so your rule wins:

```css
:root {
  --mat-sys-primary: light-dark(#6750a4, #cfbcff);
  --mat-sys-on-primary: light-dark(#ffffff, #381e72);
  --mat-sys-primary-container: light-dark(#eaddff, #4f378b);
  --mat-sys-on-primary-container: light-dark(#21005d, #eaddff);
}
```

Generating a full, consistent M3 tonal palette (13 shades per color role, correctly paired
light/dark values) by hand is tedious and easy to get wrong — see Angular Material's own
[theming guide](https://material.angular.dev/guide/theming) for how to generate one from a seed
color, then paste the resulting custom properties into your own stylesheet. The output is plain
CSS variables — nothing Angular- or Sass-build-specific — so it drops straight into a Qwik app.

### Applying a CMS/brand stylesheet

If your brand CSS targets Angular Material's real class names directly (`.mat-mdc-button`,
`.mdc-text-field`, …) rather than going through the token layer, it will apply here too: this
port's DOM and class names are byte-for-byte identical to Angular Material's — that's the parity
target the whole port is held to (see the repo's `qwik-cdk-parity-tests` suite). A brand
stylesheet written against Angular Material's markup doesn't need to be rewritten for qwik-material.

## Scoping a theme to part of your app

Since tokens are plain custom properties, scoping follows normal CSS cascade rules — redefine them
on any ancestor element, not just `:root`:

```css
.dark-section {
  --mat-sys-surface: #121316;
  --mat-sys-on-surface: #e3e2e6;
}
```

Every qwik-material component inside `.dark-section` picks up the override automatically, with no
component-level theming prop to set.
