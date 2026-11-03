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

## Typography classes and elevation classes (opt-in)

Two more CSS files exist alongside every component's own `<component>-prebuilt.css` (see
[Getting started](/guide/getting-started/)), for the same two upstream Sass mixins `mat.theme()`
itself never calls, so neither one is in `core-prebuilt.css`:

```ts
import '@angular-community/qwik-material/typography-prebuilt.css';
import '@angular-community/qwik-material/elevation-prebuilt.css';
```

**`typography-prebuilt.css`** gives you `mat.typography-hierarchy()`'s classes, token-driven off
the SAME `--mat-sys-*` typography tokens `core-prebuilt.css` sets (so they follow your overrides
automatically): `.mat-typography` as the ancestor scope, `.mat-display-large`/`.mat-headline-large`/
`.mat-title-large`/`.mat-body-large`/`.mat-label-large` (and their `-medium`/`-small` siblings),
plain `h1`...`h6`/`p` tags *inside* `.mat-typography`, and the M2-era aliases
(`.mat-h1`...`.mat-h6`, `.mat-headline-1`...`.mat-headline-6`, `.mat-body`/`.mat-body-strong`/
`.mat-body-2`, `.mat-small`/`.mat-caption`, `.mat-subtitle-1`/`.mat-subtitle-2`) — the bare class
names work anywhere on the page; the tag selectors need the `.mat-typography` ancestor:

```tsx
<div class="mat-typography">
  <h1>Styled like Material's display-large</h1>
  <p>Styled like Material's body-large, with proper paragraph spacing.</p>
</div>
```

**`elevation-prebuilt.css`** gives you `.mat-elevation-z0` through `.mat-elevation-z24` (plus the
`.mat-mdc-elevation-specific.mat-elevation-zN` combination some component CSS needs internally).
**Known upstream limitation, reproduced faithfully:** as of Angular Material 21.2.14, these
classes render **no visible shadow at all** by default (`box-shadow` computes to `none`) — this
is a real, confirmed gap in upstream's own `mat.elevation-classes()` mixin (verified against a
real Angular 21.2.14 render, not just reading its Sass source), not something specific to this
port: the mixin's `box-shadow` fallback is computed once, at Sass-compile-time, from a hardcoded
map where the shadow *color* is left as an unwrapped, invalid CSS variable reference. If you need
working elevation shadows, set `--mat-app-elevation-shadow-level-<N>` yourself for each level you
use, bypassing the broken fallback entirely — there is no `mat.elevation-overrides()`-style mixin
for this (`mat.theme-overrides()`, below, does not reach it either — it only recognizes
`--mat-sys-*` names):

```css
.mat-elevation-z4 {
  --mat-app-elevation-shadow-level-4: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);
}
```

## Theming via upstream's own Sass API

If your app already has Angular Material's real `@angular/material` Sass package as a
dependency (e.g. a CMS/design-system build pipeline that generates theme overrides through it, or
you're migrating an app that already themes this way), you can keep using it — qwik-material's
tokens and DOM are byte-for-byte identical to upstream's, so Sass compiled against the real
`@angular/material` package themes this port exactly the same way it themes Angular Material
itself. **Verified concretely**, not just asserted: compiling

```scss
@use '@angular/material' as mat;

:root {
  @include mat.button-overrides((filled-container-color: red));
}
```

produces `:root { --mat-button-filled-container-color: red; }` — the exact CSS variable
`button-prebuilt.css` already reads (`background-color: var(--mat-button-filled-container-color,
var(--mat-sys-primary))`) — and applying that one declaration to a live
`<MatButton appearance="filled">` really does flip its computed background color.

**Use ONLY the token-emitting `*-overrides()` mixins** (`mat.theme-overrides(...)`,
`mat.button-overrides(...)`, `mat.checkbox-overrides(...)`, one per component, same naming as the
component itself) — every one of these just emits `--mat-*`/`--mat-sys-*` custom property
declarations, nothing else, which is exactly what this port's prebuilt CSS already reads.

**Do NOT include**, because they'd duplicate (and can conflict with) the structural CSS your
`<component>-prebuilt.css` imports already provide:

- `mat.core()` — a no-op as of this Angular Material version anyway, but never needed here.
- Any full `*-theme()`/`*-color()`/`*-typography()`/`*-density()`/`*-base()` mixin
  (`mat.button-theme($theme)`, `mat.all-component-themes($theme)`, …) — these emit the component's
  entire structural ruleset (selectors, layout, every property, not just token values), which this
  port already ships compiled into `<component>-prebuilt.css`. Running them again produces a
  second, separate copy of the same rules, which only adds specificity/ordering risk for no benefit.
- `mat.typography-hierarchy($theme)`/`mat.elevation-classes()` themselves, if you only want the
  token VALUES to differ — those mixins emit the CLASSES this port already ships as
  `typography-prebuilt.css`/`elevation-prebuilt.css` (above); override the tokens those files
  already read instead.

The recommended setup, end to end: keep importing every `*-prebuilt.css` file from
`@angular-community/qwik-material` as usual (that's your structural CSS), then compile your own
small Sass entry that calls only `mat.theme-overrides(...)` plus whichever `*-overrides(...)`
per-component mixins you need, and load the resulting plain CSS output alongside the prebuilt
files (after them, so your overrides win the cascade).
