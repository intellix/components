`<MatIcon>` makes it easier to use _vector-based_ icons in your app. This component supports both
icon fonts and SVG icons, but not bitmap-based formats (png, jpg, etc.).

<!-- example(icon-overview) -->

### Registering icons

`useMatIconRegistry()` (or the `<MatIconRegistryProvider>` component built on top of it) creates
an icon registry and provides it to every `<MatIcon>` in its subtree, letting you associate names
with SVG URLs or HTML strings. Its functions are discussed below.

```tsx
import {MatIconRegistryProvider, trustIconResourceUrl} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <MatIconRegistryProvider icons={[{name: 'thumbs-up', url: trustIconResourceUrl('/icons/thumb-up.svg')}]}>
    <Slot />
  </MatIconRegistryProvider>
));
```

Icons registered at app startup from data loaded at runtime (e.g. a list fetched from an API inside
a `routeLoader$`) work the same way — build the `icons`/`iconSets` array from that data:

```tsx
export const useIcons = routeLoader$(async () => {
  const icons = await fetch('https://api.example.com/icons').then(r => r.json());
  return icons as Array<{name: string; url: string}>;
});

export default component$(() => {
  const icons = useIcons();
  return (
    <MatIconRegistryProvider
      icons={icons.value.map(i => ({name: i.name, url: trustIconResourceUrl(i.url)}))}
    >
      <Slot />
    </MatIconRegistryProvider>
  );
});
```

For imperative registration from elsewhere in the tree, call the registry functions directly
against the store `useOptionalIconRegistry()` returns:

```tsx
const registry = useOptionalIconRegistry();
if (registry) addSvgIcon(registry, 'thumbs-up', trustIconResourceUrl('/icons/thumb-up.svg'));
```

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
itself. This approach offers an advantage over an `<img>` tag or a CSS `background-image` because
it allows styling the SVG with CSS. For example, the default color of the SVG content is the CSS
[currentColor](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentColor_keyword)
value. This makes SVG icons by default have the same color as surrounding text, and allows you to
change the color by setting the `color` style on the `<MatIcon>` element.

Two ways to provide the SVG content:

```tsx
{/* 1. svgLiteral — a raw SVG string, trusted verbatim, no registry involved. */}
<MatIcon svgLiteral={thumbUpSvgString} svgName="thumb-up" />

{/* 2. svgIcon — resolved by name from a MAT_ICON_REGISTRY ancestor (see "Registering icons"
      above). Works at SSR time (the server HTML already contains the resolved <svg> — no
      flash, no client JS needed) and re-resolves on the client if the name changes later. */}
<MatIcon svgIcon="thumbs-up" />
<MatIcon svgIcon="animals:cat" /> {/* namespaced */}
```

In order to guard against XSS vulnerabilities, any SVG URL or HTML string registered with the
icon registry must be marked as trusted using `trustIconResourceUrl()`/`trustIconHtml()` —
this port's equivalent of Angular's `DomSanitizer` (see
[Angular → Qwik notes](#angular-qwik-notes) below). `svgLiteral` has no such wrapper — it's
trusted verbatim, so pre-bundle or otherwise validate any SVG string before passing it directly.

The registry fetches remote SVG icons via the platform `fetch()` (not `HttpClient`/`XMLHttpRequest`
— see [Angular → Qwik notes](#angular-qwik-notes)), subject to the same
[same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy).
Concurrent requests for the same URL are deduplicated, and a successful fetch is cached.

#### Named icons

To associate a name with an icon URL, use `addSvgIcon`, `addSvgIconInNamespace`,
`addSvgIconLiteral`, or `addSvgIconLiteralInNamespace` (or the `icons` prop on
`<MatIconRegistryProvider>`, which calls these for you). After registering an icon, it can be
displayed by setting the `svgIcon` prop. For an icon in the default namespace, use the name
directly. For a non-default namespace, use the format `[namespace]:[name]`.

#### Icon sets

Icon sets allow grouping multiple icons into a single SVG file. This is done by creating a single
root `<svg>` tag that contains multiple nested elements (typically `<symbol>`), each identified
with an `id` attribute. This `id` is used as the name of the icon.

Icon sets are registered using `addSvgIconSet`, `addSvgIconSetInNamespace`,
`addSvgIconSetLiteral`, or `addSvgIconSetLiteralInNamespace` (or the `iconSets` prop on
`<MatIconRegistryProvider>`). After an icon set is registered, each of its embedded icons can be
accessed by their `id` attributes, the same way as for individually registered icons.

Multiple icon sets can be registered in the same namespace. Requesting an icon whose id appears in
more than one icon set, the icon from the most recently registered set will be used.

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

- **No `MatIconRegistry` *class*, but the same capabilities.** No `@Injectable`, no Angular DI —
  `useMatIconRegistry()`/`<MatIconRegistryProvider>` create a plain data store (provided via
  context) and `addSvgIcon`/`getNamedSvgIcon`/etc. are plain functions that take it as their
  first argument (`addSvgIcon(registry, name, url)`, not `registry.addSvgIcon(name, url)`).
- **No `HttpClient`/`XMLHttpRequest`.** The registry fetches icon URLs with the platform
  `fetch()` directly. This package has no router dependency, so it can't resolve a root-relative
  URL (`/icons/home.svg`) against the current request's origin during SSR — register an
  absolute URL, or resolve one to absolute yourself (e.g. inside a `routeLoader$`, which has the
  request URL) before calling `addSvgIcon`.
- **No `DomSanitizer`.** `trustIconResourceUrl(url)`/`trustIconHtml(html)` (`icon-trusted.ts`) are
  the explicit "I trust this" opt-in every `addSvgIcon*`/`addSvgIconSet*` function requires
  instead — the same one-line bypass Angular's `sanitizer.bypassSecurityTrustResourceUrl()`/
  `bypassSecurityTrustHtml()` is, and the same warning applies: it does not sanitize anything,
  so only use it with content your app fully controls.
- **`addSvgIconResolver`'s resolvers are process-global, not per-registry.** A resolver is a
  plain function, which can't live inside the (serializable) registry store — register resolvers
  once, at module-evaluation time, not conditionally per request.
- **`registerFontClassAlias`/`classNameForFontAlias`/`setDefaultFontSetClass`/
  `getDefaultFontSetClass` exist on the registry for API-surface completeness, but `<MatIcon>`'s
  font-mode rendering does NOT consult them.** The *effect* `setDefaultFontSetClass` has
  upstream is still the separate, pre-existing `MatIconConfig.fontSet` mechanism:
  `MatIconConfig.fontSet` (set via `QwikMaterialProvider`) falls back to upstream's own built-in
  default font-set class ladder (`material-icons mat-ligature-font`) when neither the prop nor
  the config is set, instead of applying no class at all.
- **`color` accepts any string, not just `'primary' | 'accent' | 'warn'`** — matches upstream's
  own `color` setter type (`string | null | undefined`); the three palette names are still
  suggested by autocomplete.
- **`aria-label` is a declared prop on `<MatIcon>`** (pair with `aria-hidden={false}` for a
  labeled, interactive-icon-as-control usage) — not spread as an arbitrary attribute.
- **`hostContent` prop** renders extra content as `<MatIcon>`'s real last child (font mode only)
  — the equivalent of a directive like `[matBadge]` attaching to a consumer's own `<mat-icon>`
  and appending its own element; see [Composing directives](/guide/composing-directives/) and the
  Badge component page.
- **Global defaults via `QwikMaterialProvider`**, not an `MAT_ICON_CONFIG` injection token.
- **Harness not ported.**
