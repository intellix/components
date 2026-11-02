# qwik-material Badge port — design spec

Port `src/material/badge/` into a `qwik-material/badge` entry-point. Fifth component after Dialog + Button + Card + Toolbar. Non-trivial API (~7 inputs) but a single visual component. Upstream is a `[matBadge]` attribute directive with no custom-element tag; the port translates it into a `<MatBadge>` wrapper component.

- **Upstream source:** `src/material/badge/` (1 TS file with 375 LOC directive + a `_MatBadgeStyleLoader` no-op component, 3 SCSS files, 378-line spec).
- **New entry-point:** `@angular-community/qwik-material/badge` at `src/qwik-material/badge/`.
- **New prebuilt CSS:** `@angular-community/qwik-material/badge-prebuilt.css`.
- **Branch:** `qwik-cdk-dialog-port` (continues on the same branch as the other qwik-material ports).
- **Base commit:** tip of the Toolbar port after final review — `7650f69`.

---

## 1. Package layout

Under `src/qwik-material/`:

```
badge/
  badge-color.ts             — MatBadgeColor type
  badge-color.spec.ts
  badge-position.ts          — MatBadgePosition type (8-value union)
  badge-position.spec.ts
  badge-size.ts              — MatBadgeSize type
  badge-size.spec.ts
  badge-config.ts            — MatBadgeConfig + MAT_BADGE_CONFIG token
  badge-config.spec.ts
  mat-badge.tsx              — <MatBadge>
  mat-badge.spec.tsx         — smoke
  mat-badge-scenarios.spec.tsx — upstream scenario port
  public-api.ts              — consumer-facing re-exports
  index.ts                   — `export * from './public-api'`
  SYNC.md                    — deviation log
scss/
  badge/
    badge.scss               — verbatim copy
    _badge-theme.scss        — verbatim copy
    _m2-badge.scss           — verbatim copy
    _m3-badge.scss           — verbatim copy
    badge-prebuilt.scss      — NEW: @use badge.scss + M3 :root defaults
```

**No `intrinsic-elements.d.ts`** for this port — badge doesn't render a custom tag, only a `<span>` wrapper with classes.

Existing files reused (no changes):
- `tsconfig.json`, `vitest.setup.ts`, `scripts/lint-no-ssr-leaks.mjs`

**Modified:**
- `src/qwik-material/package.json` — add `./badge` + `./badge-prebuilt.css` exports
- `src/qwik-material/vite.config.ts` — `entries` gains `'badge'`; `sassEntries` gains badge prebuilt
- `src/qwik-material/dialog/qwik-material-provider.tsx` — add `matBadgeConfig?: MatBadgeConfig` prop + `useContextProvider(MAT_BADGE_CONFIG, ...)` call

**qwik-cdk-dev-app changes:**
- `src/root.tsx`: add `import '@angular-community/qwik-material/badge-prebuilt.css';`
- `src/routes/index.tsx`: add a "Badges" section with 8 route links
- `src/routes/mat-badge/<name>/index.tsx`: 8 new route files

**qwik-cdk-parity-tests changes:**
- `specs/material-badge/`: 8 Playwright specs asserting wrapper classes + content

---

## 2. Public API surface

Everything the consumer sees. No exported classes.

### 2.1 Types

```ts
export type MatBadgeColor = 'primary' | 'accent' | 'warn';

export type MatBadgePosition =
  | 'above after'
  | 'above before'
  | 'below before'
  | 'below after'
  | 'before'
  | 'after'
  | 'above'
  | 'below';

export type MatBadgeSize = 'small' | 'medium' | 'large';

export interface MatBadgeConfig {
  position?: MatBadgePosition;   // default 'above after'
  size?: MatBadgeSize;            // default 'medium'
  color?: MatBadgeColor;          // default 'primary'
  overlap?: boolean;              // default true
}

export const MAT_BADGE_CONFIG: ContextId<MatBadgeConfig>;
```

### 2.2 Component

```ts
export interface MatBadgeProps {
  /** Content shown inside .mat-badge-content. Empty string / undefined toggles mat-badge-hidden. */
  content?: string | number;
  /** M2 palette color. Deprecated in M3 but honoured. */
  color?: MatBadgeColor;
  /** Whether the badge overlaps its content. Defaults to config or true. */
  overlap?: boolean;
  /** Disables the badge (grays it out). Default false. */
  disabled?: boolean;
  /** Position of the badge overlay. Defaults to config or 'above after'. */
  position?: MatBadgePosition;
  /** Visually-hidden description read by screen readers. */
  description?: string;
  /** Badge size. Defaults to config or 'medium'. */
  size?: MatBadgeSize;
  /** When true, applies .mat-badge-hidden class. Default false. */
  hidden?: boolean;
  class?: string | ReadonlyArray<string>;
  id?: string;
}
export const MatBadge: Component<MatBadgeProps>;
```

### 2.3 QwikMaterialProvider extension

The existing `QwikMaterialProvider` gains one more optional prop:

```ts
export interface QwikMaterialProviderProps {
  matDialogDefaults?: Partial<MatDialogConfig>;              // existing
  matDialogScrollStrategyFactory?: () => ScrollStrategy;     // existing
  animationsDisabled?: boolean;                              // existing
  matButtonConfig?: MatButtonConfig;                         // existing
  matCardConfig?: MatCardConfig;                             // existing
  matBadgeConfig?: MatBadgeConfig;                           // NEW
}
```

If `matBadgeConfig` is set, the provider installs `MAT_BADGE_CONFIG` in its subtree. Badges outside the provider get the built-in defaults.

### 2.4 Public API file layout

`badge/public-api.ts`:

```ts
export type {MatBadgeColor} from './badge-color';
export type {MatBadgePosition} from './badge-position';
export type {MatBadgeSize} from './badge-size';
export type {MatBadgeConfig} from './badge-config';
export {MAT_BADGE_CONFIG} from './badge-config';
export {MatBadge, type MatBadgeProps} from './mat-badge';
```

`badge/index.ts`:

```ts
export * from './public-api';
```

---

## 3. Internal architecture

### 3.1 Rendered DOM

`<MatBadge content="5" color="primary"><button>Notifications</button></MatBadge>` renders:

```html
<span
  class="mat-badge mat-badge-primary mat-badge-medium
         mat-badge-above mat-badge-after mat-badge-overlap"
>
  <button>Notifications</button>
  <span
    class="mat-badge-content mat-badge-active"
    id="mat-badge-content-0"
    aria-hidden="true"
  >5</span>
</span>
```

With `description="3 unread messages"` added:

```html
<span class="mat-badge ...">
  <button>Notifications</button>
  <span class="mat-badge-content mat-badge-active" id="mat-badge-content-0" aria-hidden="true">
    5
    <span class="cdk-visually-hidden">3 unread messages</span>
  </span>
</span>
```

The wrapper `<span>` carries the position/size/color/state classes. Consumer content projects via `<Slot />`. The description span sits inside the badge-content span (screen readers pick it up in reading order regardless of whether the host is interactive).

### 3.2 MatBadge reference implementation

```tsx
// mat-badge.tsx
import {component$, Slot, useContext} from '@builder.io/qwik';
import type {MatBadgeColor} from './badge-color';
import type {MatBadgePosition} from './badge-position';
import type {MatBadgeSize} from './badge-size';
import {MAT_BADGE_CONFIG, type MatBadgeConfig} from './badge-config';

export interface MatBadgeProps {
  content?: string | number;
  color?: MatBadgeColor;
  overlap?: boolean;
  disabled?: boolean;
  position?: MatBadgePosition;
  description?: string;
  size?: MatBadgeSize;
  hidden?: boolean;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const DEFAULTS: MatBadgeConfig = {
  position: 'above after',
  size: 'medium',
  color: 'primary',
  overlap: true,
};

let _idSeq = 0;

export const MatBadge = component$<MatBadgeProps>(props => {
  const config = useContext(MAT_BADGE_CONFIG, DEFAULTS);
  const position = props.position ?? config.position ?? 'above after';
  const size = props.size ?? config.size ?? 'medium';
  const color = props.color ?? config.color ?? 'primary';
  const overlap = props.overlap ?? config.overlap ?? true;
  const disabled = props.disabled ?? false;
  const hidden = props.hidden ?? false;

  const contentStr = props.content == null ? '' : `${props.content}`.trim();
  const isAbove = !position.includes('below');
  const isAfter = !position.includes('before');
  const isHidden = hidden || !contentStr;

  const classes = [
    'mat-badge',
    color && `mat-badge-${color}`,
    `mat-badge-${size}`,
    isAbove ? 'mat-badge-above' : 'mat-badge-below',
    isAfter ? 'mat-badge-after' : 'mat-badge-before',
    overlap && 'mat-badge-overlap',
    isHidden && 'mat-badge-hidden',
    disabled && 'mat-badge-disabled',
    props.class,
  ].filter(Boolean) as string[];

  const badgeContentId = `mat-badge-content-${_idSeq++}`;

  return (
    <span id={props.id} class={classes}>
      <Slot />
      <span
        id={badgeContentId}
        class="mat-badge-content mat-badge-active"
        aria-hidden="true"
      >
        {contentStr}
        {props.description && (
          <span class="cdk-visually-hidden">{props.description}</span>
        )}
      </span>
    </span>
  );
});
```

### 3.3 Config token

`badge-config.ts`:

```ts
import {createContextId} from '@builder.io/qwik';
import type {MatBadgeColor} from './badge-color';
import type {MatBadgePosition} from './badge-position';
import type {MatBadgeSize} from './badge-size';

export interface MatBadgeConfig {
  position?: MatBadgePosition;
  size?: MatBadgeSize;
  color?: MatBadgeColor;
  overlap?: boolean;
}

export const MAT_BADGE_CONFIG = createContextId<MatBadgeConfig>('qwik-material/badge-config');
```

Plain data — no `NoSerialize` needed.

### 3.4 Type files

`badge-color.ts`:

```ts
export type MatBadgeColor = 'primary' | 'accent' | 'warn';
```

`badge-position.ts`:

```ts
/**
 * Position of a MatBadge relative to its host element.
 * Any combination of 'above'|'below' and 'before'|'after'.
 */
export type MatBadgePosition =
  | 'above after'
  | 'above before'
  | 'below before'
  | 'below after'
  | 'before'
  | 'after'
  | 'above'
  | 'below';
```

`badge-size.ts`:

```ts
export type MatBadgeSize = 'small' | 'medium' | 'large';
```

---

## 4. SSR safety

Badge is 100% pure JSX from props/context:

- No `document.*` / `window.*` / `navigator.*` access
- No `useVisibleTask$`
- No `useSignal` or `useStore` inside MatBadge
- No QRLs

The module-level `let _idSeq = 0` counter is SSR-safe in the sense that it doesn't touch browser globals, but it does share state across renders within a single module load. Same pattern used by Dialog + Card ports; documented caveat in SYNC.md.

`scripts/lint-no-ssr-leaks.mjs` should report zero violations without opt-outs.

---

## 5. Reactivity

Props flow through directly on every render. Signal-backed props re-render the correct class list. Config from `MAT_BADGE_CONFIG` is read via `useContext(MAT_BADGE_CONFIG, DEFAULTS)` — standard Qwik context.

---

## 6. CSS delivery

### 6.1 Prebuilt entry

`src/qwik-material/scss/badge/badge-prebuilt.scss`:

```scss
@use './badge';

// Minimal Material Design 3 defaults so a bare consumer sees a themed badge.
// Values sourced from @angular/material/badge M3 tokens. The Task 2 implementer
// verifies actual --mat-badge-* variable names by grepping the emitted CSS
// before shipping (established pattern from Card + Toolbar — prevents phantom
// variables). Placeholder values below; adjust names to match emitted CSS.
:root {
  --mat-badge-background-color: var(--mat-sys-error, #d32f2f);
  --mat-badge-text-color: var(--mat-sys-on-error, #ffffff);
  --mat-badge-text-font: Roboto, "Helvetica Neue", sans-serif;
  --mat-badge-text-size: 0.75rem;
  --mat-badge-text-weight: 600;
  --mat-badge-line-height: 1;
  --mat-badge-container-shape: 100px;
  --mat-badge-small-size-container-size: 6px;
  --mat-badge-container-size: 22px;
  --mat-badge-large-size-container-size: 28px;
  --mat-badge-container-offset: -11px 0;
  --mat-badge-legacy-container-size: unset;
  --mat-badge-legacy-small-size-container-size: unset;
  --mat-badge-legacy-large-size-container-size: unset;
}
```

**Note:** the actual `--mat-badge-*` variable names above are best-effort guesses. Task 2 of the implementation plan MUST verify the real names via `grep -oE "var\(--mat-badge-[a-z-]+" dist/badge-prebuilt.css` after the initial build and update this `:root` block to match reality — same class of bug caught in Card Task 2 (`--mdc-*-card-*` didn't connect to `--mat-card-*`) and Toolbar Task 2 (phantom `--mat-toolbar-title-text-color`).

### 6.2 Vite plumbing

`vite.config.ts` gains one entry pair:

```ts
const entries = ['dialog', 'button', 'card', 'toolbar', 'badge'];
const sassEntries: [string, string][] = [
  ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
  ['scss/button/button-prebuilt.scss', 'dist/button-prebuilt.css'],
  ['scss/card/card-prebuilt.scss', 'dist/card-prebuilt.css'],
  ['scss/toolbar/toolbar-prebuilt.scss', 'dist/toolbar-prebuilt.css'],
  ['scss/badge/badge-prebuilt.scss', 'dist/badge-prebuilt.css'],
];
```

`package.json` gains two export entries:

```json
"./badge": {
  "qwik": "./badge/index.ts",
  "types": "./dist/badge/index.d.ts",
  "import": "./dist/badge/index.js"
},
"./badge-prebuilt.css": "./dist/badge-prebuilt.css",
```

### 6.3 SCSS stub reuse

Expected: 0 new stubs. Badge SCSS chain is minimal and reuses existing Dialog + Button + Card + Toolbar core stubs. Task 2 confirms iteratively.

---

## 7. Testing strategy

### 7.1 Vitest scenarios

Ported from `src/material/badge/badge.spec.ts` (378 LOC, ~30 upstream `it()` blocks — pre-enumerated during Task 6 by grepping the file).

Restructured for smoke-only vitest constraint:
- **Live sanity tests (7):** `MatBadge` typeof + all 5 exported types accept documented literal values + `MAT_BADGE_CONFIG.id` string
- **describe.skip (~15 DOM-render stubs):** deferred to Playwright Task 8
- **describe.skip (~8 Angular-only stubs):** AriaDescriber CDK integration, InteractivityChecker, rAF animation-in, SSR badge cleanup — all Angular-specific, no Qwik equivalent

Total target: 7 passing + upstream-count skipped stubs.

### 7.2 Dev-app routes (8)

Under `src/qwik-cdk-dev-app/src/routes/mat-badge/`:

| Route              | Renders                                                                     |
|--------------------|-----------------------------------------------------------------------------|
| `basic/`           | `<MatBadge content="5"><button>Notifications</button></MatBadge>`           |
| `colors/`          | 3 badges primary/accent/warn side-by-side                                   |
| `sizes/`           | 3 badges small/medium/large side-by-side                                    |
| `positions/`       | 4 badges (above-after, above-before, below-after, below-before)             |
| `no-overlap/`      | `<MatBadge content="9" overlap={false}><button>Cart</button></MatBadge>`    |
| `hidden/`          | `<MatBadge content="5" hidden><button>Inbox</button></MatBadge>`            |
| `disabled/`        | `<MatBadge content="5" disabled><button>Alerts</button></MatBadge>`         |
| `description/`     | `<MatBadge content="5" description="3 unread messages"><button>Msgs</button></MatBadge>` |

Each route renders `<main data-scenario-ready>ready</main>` after mount for Playwright wait. Adds a new "Badges" `<section>` to the dev-app index alongside existing sections.

### 7.3 Playwright parity specs (8)

Under `src/qwik-cdk-parity-tests/specs/material-badge/`. Each spec asserts on the wrapper span's classes + the badge-content span. Example (`basic.spec.ts`):

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/basic — wrapper span carries mat-badge classes + content span present', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-badge/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badge = page.locator('span.mat-badge');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveClass(/mat-badge(\s|$)/);
  await expect(badge).toHaveClass(/mat-badge-primary/);
  await expect(badge).toHaveClass(/mat-badge-medium/);
  await expect(badge).toHaveClass(/mat-badge-above/);
  await expect(badge).toHaveClass(/mat-badge-after/);
  await expect(badge).toHaveClass(/mat-badge-overlap/);

  const content = page.locator('span.mat-badge-content');
  await expect(content).toBeVisible();
  await expect(content).toHaveText('5');
  await expect(content).toHaveAttribute('aria-hidden', 'true');
  await expect(content).toHaveClass(/mat-badge-active/);
});
```

Similar structure for the other 7 routes.

---

## 8. Deviations from upstream

Recorded in `src/qwik-material/badge/SYNC.md`:

1. **`[matBadge]` attribute directive → `<MatBadge>` wrapper component.** Consumer wraps their element in `<MatBadge>`; wrapper renders an extra `<span class="mat-badge">` around consumer content. Classes on the wrapper, NOT on the consumer's element.
2. **CDK `AriaDescriber` + `InteractivityChecker` skipped.** `description` prop always renders an inline `<span class="cdk-visually-hidden">` inside the badge-content span. Works for both interactive and non-interactive hosts without runtime focusability detection. Deferred: no `aria-describedby` on the host element.
3. **`ngDevMode` "matBadge on aria-hidden mat-icon" warning skipped** — Angular-specific dev-mode helper.
4. **rAF fade-in animation skipped.** `.mat-badge-active` class always applied at render time — no `useVisibleTask$` deferring the class toggle. Consumer sees the badge immediately (not faded in).
5. **SSR badge-cleanup (`_clearExistingBadges`) skipped.** Angular's `renderer.createElement` + `host.appendChild` approach needed cleanup on re-hydration; Qwik's static resume model doesn't need it.
6. **`content` prop typed `string | number | undefined`** (drops `null` — Qwik idiom favors `undefined`).
7. **`MAT_BADGE_CONFIG` folded into `QwikMaterialProvider.matBadgeConfig`** — established pattern from Dialog + Button + Card.
8. **Module-level `_idSeq` counter** for `.mat-badge-content` id. Global monotonic id per module load. Not request-scoped; on SSR + hydration, ids may not match between server and client renders. Same pattern as Dialog + Card `_idSeq`. Documented caveat.
9. **`throwError` on non-element hosts skipped.** Consumer's Slot content is whatever they pass; no runtime validation.
10. **`_MatBadgeStyleLoader` component omitted.** Upstream uses it via `_CdkPrivateStyleLoader` to lazy-load the badge CSS. Qwik-material consumers import `badge-prebuilt.css` directly at their app root; no lazy loading needed.

---

## 9. Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest + lint + typecheck), including badge coverage
- All 8 badge variants in the dev-app (`/mat-badge/*`) render with visible M3 styling in preview mode
- SSR-leak lint reports zero violations
- 0 exported classes on the consumer surface
- Playwright material-badge specs pass locally against the built dev-app preview
- Every Playwright spec asserts on the `<span class="mat-badge">` wrapper AT LEAST ONCE — a regression that drops the wrapper fails loudly
- `src/qwik-material/badge/SYNC.md` populated with all 10 deviations + stub inventory delta (expected: zero new stubs)

---

## 10. Task decomposition preview

Estimated ~10 tasks. Similar shape to Card but smaller (single visual component vs Card's 14). Rough breakdown:

- **Phase 1 — Scaffolding** (1 task): extend vite.config entries + package.json exports + empty index.ts stub (no intrinsic-elements.d.ts — badge doesn't use custom tags)
- **Phase 2 — SCSS chain** (1 task): copy 4 SCSS files, verify build, emit `badge-prebuilt.css` with M3 :root defaults (verify emitted `--mat-badge-*` variable names match `:root` block via grep — established Card Task 2 / Toolbar Task 2 pattern)
- **Phase 3 — Foundation types** (2 tasks):
  - Task A: `badge-color.ts` + `badge-position.ts` + `badge-size.ts` (three small type files)
  - Task B: `badge-config.ts` (interface + context token)
- **Phase 4 — MatBadge component** (1 task): `mat-badge.tsx` with class ladder + description a11y
- **Phase 5 — Provider extension** (1 task): extend `QwikMaterialProvider` with `matBadgeConfig`
- **Phase 6 — Public API + build validation** (1 task): `public-api.ts` + `index.ts` + build verify + zero-classes check
- **Phase 7 — Scenario tests** (1 task): vitest scenario port (~30 upstream `it()` blocks bucketed into DOM-render + Angular-only + sanity)
- **Phase 8 — Dev-app + Playwright** (1 task): 8 dev-app routes + 8 Playwright specs (combined since both are structurally identical to earlier port patterns)
- **Phase 9 — Finalisation** (1 task): SYNC.md + pipeline verification

Rough total: 10 Badge tasks.

---

## 11. Out of scope for this port

- CDK `AriaDescriber` integration for interactive-host `aria-describedby` (simplified inline span always used instead)
- `InteractivityChecker` focusability detection
- rAF-based fade-in animation
- SSR badge-cleanup workaround (`_clearExistingBadges`)
- `_MatBadgeStyleLoader` lazy-CSS-loader component
- Dev-mode `mat-icon` warning
- `throwError` on non-element hosts
- Full M3 theming DSL (blocked on qwik-material/core; `badge-prebuilt.css` ships :root defaults as a stopgap)
