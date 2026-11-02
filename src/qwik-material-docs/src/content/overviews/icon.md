`<MatIcon>` makes it easier to use _vector-based_ icons in your app. This component supports both
icon fonts and SVG icons, but not bitmap-based formats (png, jpg, etc.).

<!-- example(icon-overview) -->

### Registering icons

There is no `MatIconRegistry` service in this port — see
[Angular → Qwik notes](#angular-qwik-notes) below.

### Font icons with ligatures

Some fonts are designed to show icons by using
[ligatures](https://en.wikipedia.org/wiki/Typographic_ligature), for example by rendering the text
"home" as a home image. To use a ligature icon, put its text in the content of `<MatIcon>`.

```tsx
<MatIcon>home</MatIcon>
```

By default, `<MatIcon>` expects the
[Material icons font](https://google.github.io/material-design-icons/#icon-font-for-the-web).
(You will still need to include the HTML to load the font and its CSS, as described in the link).

You can specify a different font, such as Material's latest icons,
[Material Symbols](https://fonts.google.com/icons), by setting the `fontSet` prop to the CSS
class for the desired font. You can set the default for every icon that doesn't specify its own
`fontSet` through `<QwikMaterialProvider matIconConfig={{fontSet: '...'}}>`.

### Font icons with CSS

Fonts can also display icons by defining a CSS class for each icon glyph, which typically uses a
`:before` selector to cause the icon to appear.
[Font Awesome](https://fontawesome.com/icons) uses this approach to display its icons. To use
such a font, set the `fontSet` prop to the font's CSS class, and set the `fontIcon` prop to the
class for the specific icon to show.

```tsx
<MatIcon fontSet="fa" fontIcon="fa-home" />
```

### SVG icons

`<MatIcon>` displays SVG icons by directly inlining the SVG content into the DOM as a child of
itself, via the `svgLiteral` prop (a raw SVG string). This approach offers an advantage over an
`<img>` tag or a CSS `background-image` because it allows styling the SVG with CSS. For example,
the default color of the SVG content is the CSS
[currentColor](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentColor_keyword)
value. This makes SVG icons by default have the same color as surrounding text, and allows you to
change the color by setting the `color` style on the `<MatIcon>` element.

```tsx
<MatIcon svgLiteral={thumbUpSvgString} svgName="thumb-up" />
```

`svgLiteral` is trusted verbatim (no `DomSanitizer` step) — pre-bundle or otherwise validate any
SVG string before passing it. There is no URL-fetching or named-icon-registry path; resolve the
SVG string yourself (e.g. a static import) and pass it directly.

### Accessibility

Similar to an `<img>` element, an icon alone does not convey any useful information for a
screen-reader user. The user of `<MatIcon>` must provide additional information pertaining to how
the icon is used. Based on the use-cases described below, `<MatIcon>` is marked as
`aria-hidden="true"` by default, but this can be overridden by passing `aria-hidden={false}`.

In thinking about accessibility, it is useful to place icon use into one of three categories:
1. **Decorative**: the icon conveys no real semantic meaning and is purely cosmetic.
2. **Interactive**: a user will click or otherwise interact with the icon to perform some action.
3. **Indicator**: the icon is not interactive, but it conveys some information, such as a status.
This includes using the icon in place of text inside of a larger message.

#### Decorative icons
When the icon is purely cosmetic and conveys no real semantic meaning, `<MatIcon>` is left at its
default `aria-hidden="true"`.

#### Interactive icons
Icons alone are not interactive elements for screen-reader users; when the user would interact
with some icon on the page, a more appropriate element should "own" the interaction:
* The `<MatIcon>` element should be a child of a `<button>`/`<MatButton>`/`<MatIconButton>` or an
  anchor.
* The parent button/anchor should either have a meaningful label provided either through direct
  text content, `ariaLabel`, or `aria-labelledby`.

#### Indicator icons
When the presence of an icon communicates some information to the user whether as an indicator or
by being inlined into a block of text, that information must also be made available to
screen-readers. The most straightforward way to do this is to
1. Add a `<span>` as an adjacent sibling to `<MatIcon>` with text that conveys the same
information as the icon, OR pass `aria-hidden={false}` and `aria-label="..."` directly to
`<MatIcon>` to label it as a control itself.
2. If using the sibling-`<span>` approach, add the `cdk-visually-hidden` class to it. This will
make the message invisible on-screen but still available to screen-reader users.

### Bidirectionality

By default icons in an RTL layout will look exactly the same as in LTR, however certain icons
have to be [mirrored for RTL users](https://material.io/design/usability/bidirectionality.html).
If you want to mirror an icon only in an RTL layout, you can use the `mat-icon-rtl-mirror` CSS
class.

```tsx
<MatIcon class="mat-icon-rtl-mirror" svgLiteral={thumbUpSvgString} />
```

## Angular → Qwik notes

- **No `MatIconRegistry` service.** No XHR SVG loader, no `addSvgIcon*`/`addSvgIconSet*`, no
  named-icon or icon-set lookup, no `HttpClient` dependency. Consumers who need registry-style
  lookup pre-bundle SVG strings themselves and pass the resolved string as `svgLiteral`.
- **`svgIcon: string` (single prop, colon-split namespace magic) → `svgLiteral` + `svgName` +
  `svgNamespace`** (three explicit props, no registry lookup, no `DomSanitizer`).
- **`registerFontClassAlias`/`setDefaultFontSetClass` methods omitted; the *effect* of the
  latter is preserved as a config fallback.** `MatIconConfig.fontSet` (set via
  `QwikMaterialProvider`) falls back to upstream's own built-in default font-set class ladder
  (`material-icons mat-ligature-font`) when neither the prop nor the config is set, instead of
  applying no class at all.
- **`aria-label` is a declared prop on `<MatIcon>`** (pair with `aria-hidden={false}` for a
  labeled, interactive-icon-as-control usage) — not spread as an arbitrary attribute.
- **`hostContent` prop** renders extra content as `<MatIcon>`'s real last child (font mode only)
  — the equivalent of a directive like `[matBadge]` attaching to a consumer's own `<mat-icon>`
  and appending its own element; see [Composing directives](/guide/composing-directives/) and the
  Badge component page.
- **Global defaults via `QwikMaterialProvider`**, not an `MAT_ICON_CONFIG` injection token.
- **Harness not ported.**
