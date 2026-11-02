# qwik-material Card port — design spec

Port `src/material/card/` into a `qwik-material/card` entry-point that consumes the existing `qwik-material` package infrastructure. Third component after Dialog + Button; validates the "purely visual multi-component container with strict DOM parity" path.

- **Upstream source:** `src/material/card/` (1 TS file with 14 exports, 3 SCSS files, 2 HTML templates, 58-line spec).
- **New entry-point:** `@angular-community/qwik-material/card` at `src/qwik-material/card/`.
- **New prebuilt CSS:** `@angular-community/qwik-material/card-prebuilt.css`.
- **Branch:** `qwik-cdk-dialog-port` (same working branch as dialog + button ports).
- **Base commit:** the tip after the Dialog DOM parity prep fix (§0 below).

---

## 0. Prerequisite: Dialog DOM parity fix

**Blocks Card execution.** Consumer has an external CMS that provides styles targeting `mat-dialog-container`, `mat-dialog-title`, `mat-dialog-content`, `mat-dialog-actions` tag names (not just classes). The dialog port currently renders `<div>` for these — CSS parity is broken today.

Lands as **one small commit before Card task 1**, treated as prep work not as a Card task. Scope:

- Verify upstream tag names by reading `src/material/dialog/dialog-container.ts` + `dialog-content-directives.ts`
- Swap the JSX host tag in each affected qwik-material dialog component:
  - `src/qwik-material/dialog/mat-dialog-container.tsx`: `<div>` → `<mat-dialog-container>`
  - `src/qwik-material/dialog/mat-dialog-title.tsx`: `<h2>` → `<h2 mat-dialog-title>` OR `<mat-dialog-title>` — pick whichever upstream renders
  - `src/qwik-material/dialog/mat-dialog-content.tsx`: `<div>` → `<mat-dialog-content>`
  - `src/qwik-material/dialog/mat-dialog-actions.tsx`: `<div>` → `<mat-dialog-actions>`
- Add `src/qwik-material/dialog/intrinsic-elements.d.ts` declaring the four tag names as `QwikIntrinsicElements['div']` / `['h2']`
- Update existing dialog Playwright specs (`src/qwik-cdk-parity-tests/specs/material-dialog/*.spec.ts`) to assert on the tag names (`page.locator('mat-dialog-container')` etc.) instead of class-based selectors, so a regression re-appears loudly
- Rebuild + confirm `pnpm test:qwik-material` still green
- Commit: `fix(multiple): render Material Dialog custom-element tag names for CSS parity`

Card execution starts from the tip of this commit. Not enumerated as a Card task in the implementation plan — treated as a prerequisite prep commit the plan authors before Task 1.

---

## 1. Package layout

Under `src/qwik-material/`:

```
card/
  card-config.ts                      — MatCardConfig + MAT_CARD_CONFIG token
  card-appearance.ts                  — MatCardAppearance type
  intrinsic-elements.d.ts             — TypeScript augmentation for custom tag names
  mat-card.tsx                        — <MatCard>
  mat-card-header.tsx                 — <MatCardHeader>
  mat-card-title-group.tsx            — <MatCardTitleGroup>
  mat-card-title.tsx                  — <MatCardTitle>
  mat-card-subtitle.tsx               — <MatCardSubtitle>
  mat-card-content.tsx                — <MatCardContent>
  mat-card-actions.tsx                — <MatCardActions>
  mat-card-footer.tsx                 — <MatCardFooter>
  mat-card-image.tsx                  — <MatCardImage> + Sm/Md/Lg/Xl variants (5 exports in one file)
  mat-card-avatar.tsx                 — <MatCardAvatar>
  public-api.ts                       — re-exports
  index.ts                            — `export * from './public-api'`
  SYNC.md                             — deviation log
  <spec>.spec.ts / .spec.tsx          — one per component (14 files)
  card.html.removed.md                — breadcrumb for upstream card.html
  card-header.html.removed.md         — breadcrumb for upstream card-header.html
  card-title-group.html.removed.md    — breadcrumb for upstream card-title-group.html
scss/
  card/
    card.scss                         — verbatim copy of src/material/card/card.scss
    _card-theme.scss                  — verbatim copy
    _m2-card.scss                     — verbatim copy
    _m3-card.scss                     — verbatim copy
    card-prebuilt.scss                — NEW: @use card + M3 :root defaults
  <stubs>/ …                          — any additional stubs the card chain needs
                                        (reuses dialog + button ports' stubs where possible)
```

Existing files reused (no changes):
- `package.json` — gains one export entry for `./card` + one for `./card-prebuilt.css`
- `tsconfig.json` (existing wildcard picks up the new `.d.ts`)
- `vite.config.ts` — `entries` gains `'card'`; `sassEntries` gains card prebuilt
- `vitest.setup.ts` — no change
- `scripts/lint-no-ssr-leaks.mjs` — no change; card has no browser-global usage

**qwik-cdk-dev-app changes:**
- `src/root.tsx`: add `import '@angular-community/qwik-material/card-prebuilt.css';`
- `src/routes/index.tsx`: add a "Cards" section listing the 10 new routes
- `src/routes/mat-card/<name>/index.tsx`: 10 new route files

**qwik-cdk-parity-tests changes:**
- `specs/material-card/`: 10 new spec files, one per dev-app route, asserting tag names + classes

---

## 2. Public API surface

Everything the consumer sees. No exported classes.

### 2.1 Types

```ts
/** Visual appearance of a <MatCard>. */
export type MatCardAppearance = 'raised' | 'outlined' | 'filled';

/** Default options merged into every <MatCard> inside a QwikMaterialProvider subtree. */
export interface MatCardConfig {
  /** Default appearance for cards. Defaults to 'raised'. */
  appearance?: MatCardAppearance;
}

export const MAT_CARD_CONFIG: ContextId<MatCardConfig>;
```

### 2.2 Components (14)

Every component accepts a `class?: string | ReadonlyArray<string>` prop merged with its own host classes.

```ts
export interface MatCardProps {
  appearance?: MatCardAppearance;    // overrides provider config
  class?: string | ReadonlyArray<string>;
  id?: string;
}
export const MatCard: Component<MatCardProps>;

export const MatCardHeader: Component<{class?: ...; id?: ...}>;
export const MatCardTitleGroup: Component<{class?: ...; id?: ...}>;
export const MatCardTitle: Component<{class?: ...; id?: ...}>;
export const MatCardSubtitle: Component<{class?: ...; id?: ...}>;
export const MatCardContent: Component<{class?: ...; id?: ...}>;
export const MatCardFooter: Component<{class?: ...; id?: ...}>;

export interface MatCardActionsProps {
  align?: 'start' | 'end';    // default 'start'
  class?: string | ReadonlyArray<string>;
  id?: string;
}
export const MatCardActions: Component<MatCardActionsProps>;

export interface MatCardImageProps {
  src: string;
  alt?: string;                       // default '' (decorative)
  class?: string | ReadonlyArray<string>;
  id?: string;
}
export const MatCardImage: Component<MatCardImageProps>;
export const MatCardSmImage: Component<MatCardImageProps>;
export const MatCardMdImage: Component<MatCardImageProps>;
export const MatCardLgImage: Component<MatCardImageProps>;
export const MatCardXlImage: Component<MatCardImageProps>;

export interface MatCardAvatarProps {
  src: string;
  alt?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}
export const MatCardAvatar: Component<MatCardAvatarProps>;
```

### 2.3 QwikMaterialProvider extension

The existing `QwikMaterialProvider` gains one more optional prop:

```ts
export interface QwikMaterialProviderProps {
  matDialogDefaults?: Partial<MatDialogConfig>;              // existing
  matDialogScrollStrategyFactory?: () => ScrollStrategy;     // existing
  animationsDisabled?: boolean;                              // existing
  matButtonConfig?: MatButtonConfig;                         // existing (Button port)
  matCardConfig?: MatCardConfig;                             // NEW
}
```

If `matCardConfig` is set, the provider installs `MAT_CARD_CONFIG` in its subtree. Cards outside the provider get the built-in default `{appearance: 'raised'}`.

### 2.4 Public API file layout

`card/public-api.ts`:
```ts
export type {MatCardAppearance} from './card-appearance';
export type {MatCardConfig} from './card-config';
export {MAT_CARD_CONFIG} from './card-config';

export {MatCard, type MatCardProps} from './mat-card';
export {MatCardHeader} from './mat-card-header';
export {MatCardTitleGroup} from './mat-card-title-group';
export {MatCardTitle} from './mat-card-title';
export {MatCardSubtitle} from './mat-card-subtitle';
export {MatCardContent} from './mat-card-content';
export {MatCardActions, type MatCardActionsProps} from './mat-card-actions';
export {MatCardFooter} from './mat-card-footer';
export {
  MatCardImage,
  MatCardSmImage,
  MatCardMdImage,
  MatCardLgImage,
  MatCardXlImage,
  type MatCardImageProps,
} from './mat-card-image';
export {MatCardAvatar, type MatCardAvatarProps} from './mat-card-avatar';
```

`card/index.ts`:
```ts
export * from './public-api';
```

---

## 3. Internal architecture

### 3.1 Custom-element TypeScript augmentation

`card/intrinsic-elements.d.ts`:

```ts
import type {QwikIntrinsicElements} from '@builder.io/qwik';

declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-card': QwikIntrinsicElements['div'];
      'mat-card-header': QwikIntrinsicElements['div'];
      'mat-card-title-group': QwikIntrinsicElements['div'];
      'mat-card-title': QwikIntrinsicElements['div'];
      'mat-card-subtitle': QwikIntrinsicElements['div'];
      'mat-card-content': QwikIntrinsicElements['div'];
      'mat-card-actions': QwikIntrinsicElements['div'];
      'mat-card-footer': QwikIntrinsicElements['div'];
    }
  }
}
```

Automatically picked up by the existing tsconfig `include` glob for `*.d.ts` under `src/qwik-material/`.

### 3.2 MatCard reference implementation

```tsx
// mat-card.tsx
import {component$, Slot, useContext} from '@builder.io/qwik';
import type {MatCardAppearance} from './card-appearance';
import {MAT_CARD_CONFIG, type MatCardConfig} from './card-config';

export interface MatCardProps {
  appearance?: MatCardAppearance;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const DEFAULTS: MatCardConfig = {appearance: 'raised'};

export const MatCard = component$<MatCardProps>(props => {
  const config = useContext(MAT_CARD_CONFIG, DEFAULTS);
  const appearance = props.appearance ?? config.appearance ?? 'raised';
  const classes = [
    'mat-mdc-card',
    'mdc-card',
    appearance === 'outlined' && 'mat-mdc-card-outlined',
    appearance === 'outlined' && 'mdc-card--outlined',
    appearance === 'filled' && 'mat-mdc-card-filled',
    appearance === 'filled' && 'mdc-card--filled',
    props.class,
  ].filter(Boolean) as (string | ReadonlyArray<string>)[];

  return (
    <mat-card id={props.id} class={classes}>
      <Slot />
    </mat-card>
  );
});
```

### 3.3 MatCardHeader with named slots

Upstream template projects children BY TYPE (avatar to one slot, title/subtitle to a wrapper div). Qwik uses `q:slot` named slots for the structured slots.

```tsx
// mat-card-header.tsx
import {component$, Slot} from '@builder.io/qwik';

export const MatCardHeader = component$<{class?: string | ReadonlyArray<string>; id?: string}>(props => {
  const classes = ['mat-mdc-card-header', props.class].filter(Boolean);
  return (
    <mat-card-header id={props.id} class={classes}>
      <Slot />
      <Slot name="avatar" />
      <div class="mat-mdc-card-header-text">
        <Slot name="text" />
      </div>
    </mat-card-header>
  );
});
```

Consumer usage:

```tsx
<MatCardHeader>
  <MatCardAvatar q:slot="avatar" src="/x.png" alt="U" />
  <MatCardTitle q:slot="text">Title</MatCardTitle>
  <MatCardSubtitle q:slot="text">Subtitle</MatCardSubtitle>
</MatCardHeader>
```

### 3.4 MatCardTitleGroup with named slots

```tsx
// mat-card-title-group.tsx
import {component$, Slot} from '@builder.io/qwik';

export const MatCardTitleGroup = component$<{class?: string | ReadonlyArray<string>; id?: string}>(props => {
  const classes = ['mat-mdc-card-title-group', props.class].filter(Boolean);
  return (
    <mat-card-title-group id={props.id} class={classes}>
      <div>
        <Slot name="text" />
      </div>
      <Slot name="image" />
      <Slot />
    </mat-card-title-group>
  );
});
```

Consumer usage:

```tsx
<MatCardTitleGroup>
  <MatCardTitle q:slot="text">Title</MatCardTitle>
  <MatCardSubtitle q:slot="text">Subtitle</MatCardSubtitle>
  <MatCardImage q:slot="image" src="/x.png" alt="X" />
</MatCardTitleGroup>
```

### 3.5 MatCardTitle / Subtitle / Content / Footer

Each is a ~10 LOC `component$` returning the custom tag with the upstream class + a single `<Slot />`. Example:

```tsx
// mat-card-title.tsx
import {component$, Slot} from '@builder.io/qwik';

export const MatCardTitle = component$<{class?: string | ReadonlyArray<string>; id?: string}>(props => {
  const classes = ['mat-mdc-card-title', props.class].filter(Boolean);
  return (
    <mat-card-title id={props.id} class={classes}>
      <Slot />
    </mat-card-title>
  );
});
```

Subtitle / Content / Footer are byte-identical except for their tag name and class.

### 3.6 MatCardActions

```tsx
// mat-card-actions.tsx
import {component$, Slot} from '@builder.io/qwik';

export interface MatCardActionsProps {
  align?: 'start' | 'end';
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardActions = component$<MatCardActionsProps>(props => {
  const classes = [
    'mat-mdc-card-actions',
    'mdc-card__actions',
    props.align === 'end' && 'mat-mdc-card-actions-align-end',
    props.class,
  ].filter(Boolean);
  return (
    <mat-card-actions id={props.id} class={classes}>
      <Slot />
    </mat-card-actions>
  );
});
```

### 3.7 MatCardImage (and 4 size variants)

All 5 image components live in one file `mat-card-image.tsx`. Each renders `<img>` directly with a distinct leading class. Byte-identical function bodies except for the class token.

```tsx
// mat-card-image.tsx
import {component$} from '@builder.io/qwik';

export interface MatCardImageProps {
  src: string;
  alt?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardImage = component$<MatCardImageProps>(props => (
  <img
    id={props.id}
    src={props.src}
    alt={props.alt ?? ''}
    class={['mat-mdc-card-image', 'mdc-card__media', props.class].filter(Boolean)}
  />
));

export const MatCardSmImage = component$<MatCardImageProps>(props => (
  <img
    id={props.id}
    src={props.src}
    alt={props.alt ?? ''}
    class={['mat-mdc-card-sm-image', 'mdc-card__media', props.class].filter(Boolean)}
  />
));

export const MatCardMdImage = component$<MatCardImageProps>(props => (
  <img
    id={props.id}
    src={props.src}
    alt={props.alt ?? ''}
    class={['mat-mdc-card-md-image', 'mdc-card__media', props.class].filter(Boolean)}
  />
));

export const MatCardLgImage = component$<MatCardImageProps>(props => (
  <img
    id={props.id}
    src={props.src}
    alt={props.alt ?? ''}
    class={['mat-mdc-card-lg-image', 'mdc-card__media', props.class].filter(Boolean)}
  />
));

export const MatCardXlImage = component$<MatCardImageProps>(props => (
  <img
    id={props.id}
    src={props.src}
    alt={props.alt ?? ''}
    class={['mat-mdc-card-xl-image', 'mdc-card__media', props.class].filter(Boolean)}
  />
));
```

Repeating five 8-line bodies is cleaner than a class-parameterized factory — no runtime branching, no abstraction to remember.

### 3.8 MatCardAvatar

```tsx
// mat-card-avatar.tsx
import {component$} from '@builder.io/qwik';

export interface MatCardAvatarProps {
  src: string;
  alt?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardAvatar = component$<MatCardAvatarProps>(props => (
  <img
    id={props.id}
    src={props.src}
    alt={props.alt ?? ''}
    class={['mat-mdc-card-avatar', props.class].filter(Boolean)}
  />
));
```

### 3.9 Config token

`card-config.ts`:

```ts
import {createContextId} from '@builder.io/qwik';
import type {MatCardAppearance} from './card-appearance';

export interface MatCardConfig {
  appearance?: MatCardAppearance;
}

export const MAT_CARD_CONFIG = createContextId<MatCardConfig>('qwik-material/card-config');
```

Plain data — no `NoSerialize` needed.

### 3.10 Card appearance type

`card-appearance.ts`:

```ts
/**
 * Visual appearance of a <MatCard>.
 * See https://m3.material.io/components/cards/overview.
 */
export type MatCardAppearance = 'raised' | 'outlined' | 'filled';
```

---

## 4. SSR safety

Every card component is 100% pure JSX from props/context:

- No `document.*` / `window.*` / `navigator.*` access
- No `useVisibleTask$`
- No `useSignal` or `useStore` inside any card component
- No QRLs

`scripts/lint-no-ssr-leaks.mjs` should report zero violations without any opt-outs.

---

## 5. Reactivity

Props flow through directly on every render. Signal-backed props re-render the correct class list because JSX reads `props.appearance` etc. on each pass. Config from `MAT_CARD_CONFIG` is read via `useContext(MAT_CARD_CONFIG, DEFAULTS)` — standard Qwik context behavior.

---

## 6. CSS delivery

### 6.1 Prebuilt entry

`src/qwik-material/scss/card/card-prebuilt.scss`:

```scss
@use './card';

// Minimal Material Design 3 defaults so a bare consumer sees a themed card.
// Values sourced from @angular/material/card M3 tokens. Overridable at :root
// or any ancestor of the card.
:root {
  // Raised (elevated) — the default appearance
  --mdc-elevated-card-container-color: var(--mat-sys-surface, #fef7ff);
  --mdc-elevated-card-container-shape: 12px;
  --mdc-elevated-card-container-elevation-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 1px 3px 1px rgba(0, 0, 0, 0.15);

  // Outlined
  --mdc-outlined-card-container-color: var(--mat-sys-surface, #fef7ff);
  --mdc-outlined-card-container-shape: 12px;
  --mdc-outlined-card-outline-color: var(--mat-sys-outline, rgba(0, 0, 0, 0.12));
  --mdc-outlined-card-outline-width: 1px;

  // Filled (Mat-specific)
  --mat-card-filled-container-color: color-mix(
    in srgb,
    var(--mat-sys-on-surface, rgba(0, 0, 0, 0.87)) 5%,
    transparent
  );
  --mat-card-filled-container-shape: 12px;

  // Typography for title / subtitle
  --mat-card-title-text-color: var(--mat-sys-on-surface, rgba(0, 0, 0, 0.87));
  --mat-card-title-text-font: Roboto, "Helvetica Neue", sans-serif;
  --mat-card-title-text-size: 1rem;
  --mat-card-title-text-weight: 500;
  --mat-card-subtitle-text-color: var(--mat-sys-on-surface-variant, rgba(0, 0, 0, 0.6));
  --mat-card-subtitle-text-font: Roboto, "Helvetica Neue", sans-serif;
  --mat-card-subtitle-text-size: 0.875rem;
  --mat-card-subtitle-text-weight: 400;
}
```

### 6.2 Vite plumbing

`vite.config.ts` gains one entry pair:

```ts
const entries = ['dialog', 'button', 'card'];
const sassEntries: [string, string][] = [
  ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
  ['scss/button/button-prebuilt.scss', 'dist/button-prebuilt.css'],
  ['scss/card/card-prebuilt.scss', 'dist/card-prebuilt.css'],
];
```

`package.json` gains two export entries:

```json
"./card": {
  "qwik": "./card/index.ts",
  "types": "./dist/card/index.d.ts",
  "import": "./dist/card/index.js"
},
"./card-prebuilt.css": "./dist/card-prebuilt.css",
```

### 6.3 SCSS stub reuse

The card SCSS chain likely `@use`s the same stubs the dialog + button ports already created under `src/qwik-material/scss/core/**`. Iterative stub loop (run build → read Sass error → add symbol / new stub → repeat). Expected 0-3 new stubs based on card's minimal chain.

---

## 7. Testing strategy

### 7.1 Vitest scenarios

Ported from `src/material/card/card.spec.ts` (58 LOC, ~8 upstream tests). Categorisation:

- **Portable** (~7): appearance class binding (raised default, outlined, filled), align='end' toggles the `.mat-mdc-card-actions-align-end` class, config-provider default appearance flows through, image + avatar classes emit
- **Angular-only** (~1): TestBed injection specifics

Plus ~10 Qwik-specific extras: smoke-tests-per-component confirming exports, class-list snapshots per appearance, `q:slot` named-slot flow-through for header + title-group.

**Total target:** ~15 passing, ~1-3 deferred. Use smoke-test-first pattern per the dialog + button port precedent (createDOM hangs the Qwik optimizer for `.spec.tsx` files).

### 7.2 Dev-app routes (10)

Under `src/qwik-cdk-dev-app/src/routes/mat-card/`:

| Route                | Renders                                                                       |
|----------------------|-------------------------------------------------------------------------------|
| `basic/`             | raised card with title + subtitle + content                                   |
| `outlined/`          | `<MatCard appearance="outlined">...`                                          |
| `filled/`            | `<MatCard appearance="filled">...`                                            |
| `with-header/`       | MatCardHeader + avatar (q:slot="avatar") + title/subtitle (q:slot="text")     |
| `with-actions-start/`| Card + content + `<MatCardActions>` (default align)                           |
| `with-actions-end/`  | Card + content + `<MatCardActions align="end">`                               |
| `with-image/`        | Card + `<MatCardImage src>` + content                                         |
| `with-footer/`       | Card + content + `<MatCardFooter>`                                            |
| `title-group/`       | MatCardTitleGroup + title/subtitle (q:slot="text") + image (q:slot="image")   |
| `full-composed/`     | Realistic composed card: header + image + content + actions                   |

Each route renders `<main data-scenario-ready>ready</main>` after mount so Playwright can wait deterministically.

The dev-app's `src/routes/index.tsx` gets a new "Cards" `<section>` listing all 10 routes; existing "Dialogs" and "Buttons" sections are preserved.

### 7.3 Playwright parity specs (10)

Under `src/qwik-cdk-parity-tests/specs/material-card/`, one spec per dev-app route, asserting both tag name AND class:

```ts
test('material-card — basic', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/basic/`);
  await page.waitForSelector('[data-scenario-ready]');
  const card = page.locator('mat-card');                       // tag-name assertion
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/mat-mdc-card/);              // class assertion
  await expect(card).toHaveClass(/mdc-card/);
  await expect(page.locator('mat-card-title')).toHaveText('Title');
});
```

Because the CMS depends on both, EVERY spec asserts on the tag name first (via `locator('mat-card')` etc.), then on classes. A regression that switches back to `<div>` fails both assertions.

---

## 8. Deviations from upstream

Recorded in `src/qwik-material/card/SYNC.md`:

1. **Image and avatar are components that render `<img>`, not directives applied to a consumer-supplied `<img>`.** `<MatCardImage src alt />` renders `<img class="mat-mdc-card-image mdc-card__media" src alt />`. Consumers who want `<picture>` or `<video>` for card media must add the classes manually to their own element until a Slot-accepting variant is added.
2. **`MAT_CARD_CONFIG` folded into `QwikMaterialProvider.matCardConfig` field.** Mirrors the dialog + button pattern; upstream has a separate `MAT_CARD_CONFIG` injection token consumed only by `MatCard`.
3. **Custom-element tag names (`mat-card`, `mat-card-header`, etc.) emitted verbatim.** Requires a small `IntrinsicElements` TypeScript augmentation. Consumers using strict JSX intrinsic typing will "just work" once the .d.ts is loaded.
4. **Header + title-group use `q:slot` named slots (`avatar`, `text`, `image`) for structured projection.** Upstream projects children by TYPE via `<ng-content select>`; Qwik has no equivalent so consumers must add the `q:slot` attribute explicitly. Documented with usage examples in this spec.
5. **`<MatCardActions>` `align` prop stays as `'start' | 'end'`.** Upstream marked `align` as TODO-to-deprecate (in favor of `actionPosition` / `actionAlignment`). We keep the current name for parity; if upstream renames it, we follow.

---

## 9. Success criteria (final self-check)

- `pnpm test:qwik-material` chain still green (build + vitest + lint + typecheck), including card coverage
- Every card variant in the dev-app (`/mat-card/*`) renders with visible M3 styling in preview mode
- SSR-leak lint reports zero violations
- 0 exported classes on the consumer surface
- Playwright material-card specs pass locally against the built dev-app preview
- **Every Playwright spec asserts on the tag name AT LEAST ONCE** — regression to `<div>` fails loudly
- `src/qwik-material/card/SYNC.md` populated with all 5 deviations + stub inventory delta
- Dialog port's DOM parity fix (§0) is landed before Card Task 1

---

## 10. Task decomposition preview

Estimated ~14 tasks. Similar shape to Button port (which was 16). Rough breakdown:

- **Prereq (0 tasks, 1 commit):** Dialog DOM parity fix (§0)
- **Phase 1 — Scaffolding** (1 task): extend vite.config entries + package.json exports + intrinsic-elements.d.ts + empty index.ts stub
- **Phase 2 — SCSS chain** (1 task): copy 4 SCSS files, iterative stub loop, emit `card-prebuilt.css` with M3 :root defaults
- **Phase 3 — Foundation types** (2 tasks): `card-appearance.ts` + `card-config.ts`
- **Phase 4 — Simple components** (2 tasks):
  - Task A: MatCardTitle + Subtitle + Content + Footer (4 nearly-identical files) + MatCardActions
  - Task B: MatCardImage (5 size variants in one file) + MatCardAvatar
- **Phase 5 — Structured components** (2 tasks): MatCardHeader with q:slot pattern; MatCardTitleGroup with q:slot pattern
- **Phase 6 — MatCard container** (1 task): MatCard with config-driven appearance
- **Phase 7 — Provider + public API** (2 tasks): extend QwikMaterialProvider; wire public-api.ts + build validation
- **Phase 8 — Scenario tests** (1 task): vitest scenario port
- **Phase 9 — Dev-app** (1 task): 10 mat-card routes + index tile + root.tsx CSS import
- **Phase 10 — Playwright parity** (1 task): 10 material-card parity specs asserting tag names + classes
- **Phase 11 — Finalisation** (1 task): SYNC.md + pipeline verification

Rough total: 14 Card tasks + 1 prep commit. Smaller than Button (16 tasks) because no ripple, no anchor form, no 5-appearance branching.

---

## 11. Out of scope for this port

- `<mat-card>` with `[href]` acting as an interactive button (upstream TODO for `MatActionCard` per `card.ts:58` — not planned by upstream yet)
- `.mdc-card__media--square` / `.mdc-card__media--16-9` aspect-ratio helpers (upstream TODO per `card.ts:174`)
- `.mdc-card__actions--full-bleed` variant (upstream TODO per `card.ts:134`)
- `.mdc-card__action-buttons` + `.mdc-card__action-icons` positional wrappers (upstream TODO per `card.ts:136`)
- Slot-accepting variant of MatCardImage / MatCardAvatar for `<picture>` / `<video>` (follow-up)
- Renaming `align` on MatCardActions to `actionPosition` (blocked on upstream rename)
- Full M3 theming DSL (blocked on qwik-material/core; card-prebuilt.css ships :root defaults as a stopgap)
