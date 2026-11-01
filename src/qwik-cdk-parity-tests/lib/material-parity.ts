import {expect, type Browser, type BrowserContext, type Page} from '@playwright/test';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {diffNodes, type DomNode} from './structural-diff.js';

/**
 * Angular-vs-Qwik DOM parity for qwik-material.
 *
 * Each scenario exists twice:
 *   - Angular: src/dev-app/qwik-parity/<component>.ts, served at
 *     http://localhost:4200/qwik-parity/<route>/<scenario>
 *   - Qwik:    src/qwik-cdk-dev-app/src/routes/<route>/<scenario>/index.tsx, served at
 *     http://localhost:4173/<route>/<scenario>/
 * Both render the compared subtree inside `[data-parity-root]`.
 *
 * The comparison is structural: tags, nesting, classes, attributes and text.
 * Framework bookkeeping is stripped (Angular `_ngcontent-*`, `ng-reflect-*`;
 * Qwik `q:*`, `q-e:*`/`q-ep:*`/`q-d:*`/`q-dp:*`/`q-w:*`/`q-wp:*` (v2's
 * renamed-from-`on:*`/`on-document:*`/`on-window:*` event-listener
 * attributes), comments). Auto-generated ids keep their shape but have
 * digits replaced with `#`, because Angular's counters are app-global.
 */

const ANGULAR_URL = `${process.env['ANGULAR_URL'] ?? 'http://localhost:4200'}/qwik-parity`;
const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

const IGNORE_ATTRS = [
  'ng-version',
  'data-qwik',
  'data-scenario-ready',
  // CDK AriaDescriber bookkeeping attribute (`[CDK_DESCRIBEDBY_HOST_ATTRIBUTE]`,
  // src/cdk/a11y/aria-describer/aria-describer.ts). Its value encodes Angular's
  // own APP_ID plus an app-global service-instance counter (e.g. "ng-1") —
  // framework-internal bookkeeping with no cross-framework meaning, the same
  // category as `_nghost-*`/`ng-reflect-*` above. Applies to any component that
  // uses AriaDescriber, not just badge.
  'cdk-describedby-host',
  // Qwik v2's per-element vnode reference (an attribute literally named `:`, values like
  // `OJ_11`) — resumability bookkeeping, same category as v1's `q:id`.
  ':',
];
const IGNORE_ATTR_PREFIXES = [
  '_ngcontent-',
  '_nghost-',
  'ng-reflect-',
  // Qwik v1 event-listener attributes (`on:click`, `on-document:click`,
  // `on-window:click`). Superseded by the `q-e:`/`q-d:`/`q-w:` scheme
  // below on v2, but harmless to keep listed (nothing emits these
  // anymore post-migration; kept for the historical record and in case
  // any cached v1 SSR output is ever compared).
  'on:',
  'on-document:',
  'on-window:',
  // `q:` SSR/resumability bookkeeping (`q:key`, `q:id`, `q:render`, ...).
  // NOTE: this is a literal "q" + colon prefix — it does NOT match v2's
  // event-listener attributes below, which use a hyphen before the colon
  // (`q-e:`, not `q:e:`), so those need their own entries.
  'q:',
  // Qwik v2 event-listener attributes — renamed from v1's `on:`/
  // `on-document:`/`on-window:` scheme (https://next.qwik.dev/docs/upgrade/):
  // `q-e:` element-scoped, `q-d:` document-scoped, `q-w:` window-scoped,
  // each with a `q-ep:`/`q-dp:`/`q-wp:` passive-listener variant (new in
  // v2, no v1 equivalent). Same category as `q:`/v1's `on:` above: Qwik
  // event-dispatch bookkeeping with no Angular equivalent attribute.
  'q-e:',
  'q-ep:',
  'q-d:',
  'q-dp:',
  'q-w:',
  'q-wp:',
  // Qwik-specific declarative event-handling bookkeeping (e.g.
  // `preventdefault:click`, `stoppropagation:click`) — these tell
  // qwikloader's dispatcher to call `event.preventDefault()`/
  // `stopPropagation()` *before* it resolves/invokes any handler (needed
  // because a QRL handler body can't do this itself: Qwik's event dispatch
  // always resolves the handler through a (micro)task-deferred `import()`,
  // even when already cached, so by the time it could call
  // `preventDefault()` a synchronous native default action — e.g. a
  // checkbox/radio's click → checked-toggle — has already run). No Angular
  // equivalent attribute exists (Angular components attach a true
  // synchronous native listener instead), so this is framework bookkeeping
  // with no cross-framework DOM meaning, same category as `on:`/`q:`.
  'preventdefault:',
  'stoppropagation:',
];
// `mat-snack-bar-fallback-visible`: added by snack-bar's 200ms enter fallback
// only if the enter animation hasn't ended by then — a render-speed race even
// within Angular itself, so it can't be part of a deterministic DOM contract.
const IGNORE_CLASSES = ['ng-star-inserted', 'mat-snack-bar-fallback-visible'];
/**
 * Directive selector attributes the *consumer* writes in an Angular template
 * (`<button matFab>`, `<img mat-card-avatar>`). Which spelling appears depends
 * on the consumer's template, so they are not part of the component's DOM
 * contract. Attributes Material's own templates emit (e.g. `matripple`) are
 * NOT listed here and must be reproduced.
 */
const CONSUMER_SELECTOR_ATTRS = [
  'matbutton',
  'mat-button',
  'mat-flat-button',
  'mat-raised-button',
  'mat-stroked-button',
  'matfab',
  'mat-fab',
  'matminifab',
  'mat-mini-fab',
  'maticonbutton',
  'mat-icon-button',
  'matbadge',
  'mat-card-avatar',
  'mat-card-image',
  'mat-card-sm-image',
  'mat-card-md-image',
  'mat-card-lg-image',
  'mat-card-xl-image',
  'mat-list-item',
  'matlistitemavatar',
  'matlistitemicon',
  'matlistitemmeta',
  'matlistitemtitle',
  'matlistitemline',
  'mat-subheader',
  'matsubheader',
  'mat-dialog-close',
  'matdialogclose',
  'mat-dialog-title',
  'matdialogtitle',
  'mat-dialog-content',
  'matdialogcontent',
  'mat-dialog-actions',
  'matdialogactions',
  'matsort',
  'mat-sort-header',
  // `[formControlName]` (Angular Forms) — like every other entry here, written as a bare
  // attribute (`formControlName="firstCtrl"`) whose VALUE is entirely consumer-chosen (the
  // control's name in whatever `FormGroup` the consumer built) and has no Qwik equivalent (no
  // real `FormGroup`/`AbstractControl` tree exists in this port — see
  // `qwik-material/form-field/mat-form-control.ts`'s own doc comment on why). First hit by
  // material.angular.dev's `stepper-overview` docs example, the first scenario anywhere in this
  // port to use Angular's real reactive-forms directives rather than a local stand-in.
  'formcontrolname',
  'mat-tab-link',
  'mattablink',
  'mat-tab-nav-bar',
  'mattabnavbar',
  'matinput',
  'matprefix',
  'matsuffix',
  'mattextprefix',
  'mattextsuffix',
  'maticonprefix',
  'maticonsuffix',
  'matsnackbarlabel',
  'matsnackbaractions',
  'matsnackbaraction',
  'matsteppernext',
  'matstepperprevious',
  'matsliderthumb',
  'matsliderstartthumb',
  'matsliderendthumb',
  'mat-menu-item',
  'matmenuitemicon',
  'matchipavatar',
  'matchipremove',
  'matchiptrailingicon',
  'matchipedit',
  'matchipinputfor',
  'mat-table',
  'mat-header-row',
  'mat-row',
  'mat-footer-row',
  'mat-header-cell',
  'mat-cell',
  'mat-footer-cell',
  'mattreenodetoggle',
  'mattreenodepadding',
  'matstartdate',
  'matenddate',
  'matdatepickercancel',
  'matdatepickerapply',
  'matdaterangepickercancel',
  'matdaterangepickerapply',
  // `mattooltip`/`cdkfocusinitial`: same category, surfaced by the verbatim material.angular.dev
  // docs examples (src/dev-app/qwik-parity/examples.ts) — unlike every project-authored Angular
  // mirror scenario elsewhere, which always binds a value-carrying directive input with
  // `[prop]="…"` specifically to avoid this echo, the real upstream `tooltip-overview`/
  // `dialog-overview` examples write `matTooltip="…"`/`cdkFocusInitial` as bare template
  // attributes, so Angular echoes them onto the host verbatim. Neither has a corresponding
  // `[attr.*]` host binding in its real upstream directive (`tooltip.ts`'s `MatTooltip`;
  // `@angular/cdk/a11y`'s `CdkFocusInitial`) — confirmed against both sources.
  'mattooltip',
  'cdkfocusinitial',
  // `matnativecontrol`: the `select[matNativeControl]` selector `MatInput` also matches (see
  // `src/material/input/input.ts`) — same consumer-selector category as `matinput` above,
  // surfaced by the verbatim `select-overview` docs example's `<select matNativeControl
  // required>` (qwik-cdk-dev-app's `mat-select/example` route implements this card with its own
  // small local control rather than teaching `qwik-material/input` a new host-element kind).
  'matnativecontrol',
];
/** Attributes whose values are (or reference) auto-generated ids. */
const ID_ATTRS = [
  'id',
  'for',
  'name',
  'aria-labelledby',
  'aria-describedby',
  'aria-controls',
  'aria-owns',
  'aria-activedescendant',
  'mat-timepicker-panel-id',
  'mat-timepicker-id',
];

export interface ParityStep {
  /** Shown in the failure message. */
  name: string;
  /** Applied identically to the Angular and the Qwik page. */
  run(page: Page): Promise<void>;
}

export interface ParityScenario {
  /** Route segment, e.g. `mat-button-toggle`. */
  route: string;
  scenario: string;
  /** Interactions; DOM is re-compared after each one. */
  steps?: ParityStep[];
  /**
   * Subtree to compare. Defaults to `[data-parity-root]`. Overlay-based
   * components (dialog) pass `.cdk-overlay-container`, which both apps create
   * under <body> once something opens; the page itself must still render a
   * `[data-parity-root]` (it is what `open()` waits for).
   */
  rootSelector?: string;
  /**
   * Skip the pre-step comparison. For content that appears asynchronously on
   * both sides (auto-opening dialogs), the first step waits for it instead.
   */
  skipInitialCompare?: boolean;
  /**
   * Pin `[data-parity-root]` to the same fixed viewport box on both pages.
   * The two dev-apps have different page chrome (Angular's shell adds a
   * toolbar and padding), so anything positioned relative to the viewport —
   * connected overlays/popovers anchored to content inside the root — gets
   * different pixel offsets unless the root itself sits at the same place.
   */
  pinRoot?: boolean;
  /**
   * Extra attribute names to ignore for this scenario only, on top of the
   * global `IGNORE_ATTRS`/`CONSUMER_SELECTOR_ATTRS`. For a *real*,
   * unmodified upstream example (as opposed to a hand-authored
   * `qwik-parity` mirror scenario, which can always sidestep this by
   * binding with `[prop]` syntax): Angular's compiler preserves a literal,
   * non-bracket template attribute on the compiled host element verbatim
   * — in ADDITION to using it to initialize the matching `@Input` — even
   * when that attribute is a custom directive input alias, not a native
   * HTML attribute. E.g. `<mat-progress-bar value="40">` (a plain
   * attribute, no brackets) leaves a literal `value="40"` on the DOM
   * alongside driving the `value` Input; `<div matBadgeOverlap="false">`
   * leaves `matbadgeoverlap="false"`. A Qwik component's JSX prop has no
   * equivalent "static vs. bound" distinction to replicate this from, so
   * whichever single behavior it picks is right for templates using
   * brackets and wrong for ones that don't (or vice versa) — this is
   * scenario-scoped, not global, specifically so it doesn't mask a real
   * `value`-attribute difference anywhere else (native `<input>`s compare
   * `value` meaningfully elsewhere in this suite).
   */
  ignoreAttrs?: string[];
  /**
   * Freezes `Date.now()`/`new Date()` to this moment on BOTH pages (Playwright's
   * `page.clock.setFixedTime()` — real timers/animations keep running, only the clock reading is
   * faked) before navigation. For a scenario whose rendered "today"-relative state (e.g. a
   * datepicker/timepicker docs example with no `startAt`/value override, which opens showing the
   * CURRENT month) would otherwise be non-deterministic run-to-run — never achieved by editing
   * the upstream example itself. See `specs/examples/angular-parity.spec.ts`'s datepicker entry.
   */
  clockDate?: Date | number | string;
}

/**
 * Computed-style comparison is on by default (see README "Computed-style comparison");
 * `PARITY_STYLES=0` runs the structural comparison only, e.g. to bisect a failure.
 */
const COMPARE_STYLES = process.env['PARITY_STYLES'] !== '0';
/**
 * Computed styles compared on every element (and its `::before`/`::after`, when rendered):
 * structure (position, display, overflow, radius, ...) and colors. Both pages render with
 * Angular's theme (see `syncTheme`), so a color difference is the component's CSS, not the
 * theme — e.g. a 5% state layer rendered opaque. Sizes/offsets are left to the attribute
 * `style` comparison, since they depend on page fonts and layout.
 */
const COMPUTED_STYLE_PROPS = [
  'display',
  'position',
  'visibility',
  'overflow-x',
  'overflow-y',
  'box-sizing',
  'pointer-events',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'opacity',
  'z-index',
  'flex-direction',
  'background-color',
  'color',
];

/** Captures the `[data-parity-root]` subtree as a normalized DomNode. */
export async function snapshotParityRoot(
  page: Page,
  rootSelector = '[data-parity-root]',
  extraIgnoreAttrs: readonly string[] = [],
): Promise<DomNode> {
  // Transient ripple elements are timing-dependent; wait them out. Ripples
  // that stay for good (radio's `mat-radio-persistent-ripple`, slider's
  // persistent hover/focus/active ripples) are part of the DOM contract and
  // are not waited for.
  await page
    .waitForFunction(
      () =>
        !document.querySelector(
          '.mat-ripple-element:not([class*="persistent-ripple"]):not(.mat-mdc-slider-hover-ripple):not(.mat-mdc-slider-focus-ripple):not(.mat-mdc-slider-active-ripple)',
        ),
      undefined,
      {
        timeout: 3000,
      },
    )
    .catch(() => {});

  // `MatFormField.ngAfterViewInit` adds `.mat-form-field-animations-enabled` to every
  // `.mat-mdc-form-field` ~300ms after mount, once, forever (never removed) — see
  // specs/material-form-field/angular-parity.spec.ts's own big ANIMATIONS-ENABLED comment and
  // its locally-defined `settle` step, which exists for exactly this reason. That spec works
  // around the race by putting its OWN settle step first in every scenario; a component that
  // merely EMBEDS a `<mat-form-field>` (e.g. chips' `grid-input`/`grid-disabled`, wrapping a
  // `mat-chip-grid` in one) has no reason to duplicate that wait itself, and the generic
  // `expectMaterialParity` sequencing (angular opened first, then qwik — see `open()` below)
  // means Angular's copy of this timer always has a head start by the time BOTH pages are
  // ready, for ANY scenario with zero steps before the first compare: confirmed live, this is
  // not qwik-specific flakiness, it reproduces 100% of the time for a zero-step outline
  // scenario embedding a form field. Waiting here, universally, before every snapshot (not
  // just a per-component opt-in) generalizes form-field's own fix to any component that
  // nests one, the same way the ripple-element wait above already does for ripples.
  await page
    .waitForFunction(
      () =>
        Array.from(document.querySelectorAll('.mat-mdc-form-field')).every(el =>
          el.classList.contains('mat-form-field-animations-enabled'),
        ),
      undefined,
      {timeout: 3000},
    )
    .catch(() => {});

  return page.locator(rootSelector).evaluate(
    (root: Element, opts) => {
      type Node = {
        tag: string;
        classes: string[];
        attrs: Record<string, string>;
        styles: Record<string, string>;
        children: Node[];
        text?: string;
      };
      // CDK's AriaDescriber mints ids shaped `cdk-describedby-message-<APP_ID>-<n>`
      // (src/cdk/a11y/aria-describer/aria-describer.ts) — the APP_ID segment is a
      // non-numeric, Angular-internal token (e.g. "ng") that a digit-only squash
      // can't normalize away. Any id-bearing attribute can hold several
      // space-delimited ids (aria-describedby, aria-labelledby, ...), so each
      // token is normalized independently: a `cdk-describedby-message-*` token
      // collapses to the bare prefix, everything else just gets its digits
      // squashed as before. Applies to any component using AriaDescriber.
      const CDK_DESCRIBEDBY_MESSAGE_PREFIX = 'cdk-describedby-message-';
      const normalizeIdValue = (value: string): string =>
        value
          .split(/(\s+)/)
          .map(token =>
            token.startsWith(CDK_DESCRIBEDBY_MESSAGE_PREFIX)
              ? 'cdk-describedby-message'
              : token.replace(/\d+/g, '#'),
          )
          .join('');
      const computedStyles = (el: Element): Record<string, string> => {
        const styles: Record<string, string> = {};
        for (const pseudo of [null, '::before', '::after'] as const) {
          const cs = getComputedStyle(el, pseudo);
          if (pseudo && (cs.content === 'none' || cs.content === 'normal')) continue;
          const prefix = pseudo ?? '';
          for (const prop of opts.styleProps)
            styles[`${prefix}${prop}`] = cs.getPropertyValue(prop);
        }
        return styles;
      };
      const walk = (el: Element): Node => {
        const classes = Array.from(el.classList)
          .filter(c => !opts.ignoreClasses.includes(c))
          .sort();
        const attrs: Record<string, string> = {};
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name;
          if (name === 'class') continue;
          if (opts.ignoreAttrs.includes(name)) continue;
          if (opts.ignoreAttrPrefixes.some(p => name.startsWith(p))) continue;
          if (name === 'style') {
            // Browser-parsed, sorted declarations: order/format-insensitive.
            const style = (el as HTMLElement).style;
            const decls = Array.from(style)
              // Numbers rounded to 2 decimals: sub-pixel float noise from
              // layout measurement (e.g. `-7.6e-06px` vs `0px`) is not a
              // difference any stylesheet can observe.
              .map(
                prop =>
                  `${prop}: ${style
                    .getPropertyValue(prop)
                    .replace(/-?\d*\.?\d+(?:e-?\d+)?/gi, n =>
                      String(Math.round(Number(n) * 100) / 100 || 0),
                    )}`,
              )
              .sort();
            if (decls.length) attrs[name] = decls.join('; ');
            continue;
          }
          attrs[name] = opts.idAttrs.includes(name) ? normalizeIdValue(attr.value) : attr.value;
        }
        // `checked` (like `value`/`selected`) is a "non-reflected" IDL
        // property: once set via JS, it diverges from its content attribute
        // for good — unlike most boolean attributes (`disabled`,
        // `required`, ...), which the browser keeps in sync with their
        // property automatically. A framework that bakes a literal
        // `checked` attribute into its *initial* SSR HTML (needed for a
        // checked control to paint correctly before any JS runs, e.g. a
        // Qwik radio/checkbox) leaves that attribute stuck forever once a
        // later *property*-only update flips the live state — while a pure
        // CSR app (this harness's Angular side has no SSR) never writes the
        // attribute at all, checked or not. That's an SSR-vs-CSR
        // architecture difference, orthogonal to actual rendered behavior
        // (which already keys off the live property / `:checked`
        // pseudo-class, never the attribute), so comparing the attribute
        // directly would be a false-positive diff. Compare the live
        // `.checked` property instead for any checkbox/radio input.
        if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
          attrs['checked'] = String(el.checked);
        }
        // `value` is the SAME "non-reflected" IDL property category as
        // `checked` above (the harness's own prior comment already names
        // it: "checked (like value/selected)..."), just divergent in the
        // OPPOSITE direction for this harness's two frameworks. Confirmed
        // live (qwik-material/form-field's disabled/readonly scenarios):
        // Qwik's SSR output DOES serialize a literal `value="…"` attribute
        // for a static, never-reassigned value (needed so the control
        // paints correctly before any JS runs) — but @qwik.dev/core's
        // OWN resumability runtime unconditionally strips that attribute
        // again shortly after hydration (confirmed via core.cjs's
        // `_setProperty`: it always sets `node[key] = value` AND, for a
        // nullish value, additionally calls `removeAttribute` — and a
        // resumed component's prop-reconciliation pass runs this for
        // `value` regardless of whether the live property already
        // matched, independent of any application-level code; reproduced
        // with a diagnostic component whose task body was a complete
        // no-op). Angular (no SSR/hydration step on this harness's side)
        // never removes a static, unbound `value="…"` template attribute
        // — so comparing the raw attribute directly is a false-positive
        // diff in the other direction from `checked`'s. Both sides'
        // rendered BEHAVIOR already keys off the live `.value` property
        // (that's what a user looking at the page, typing into it, or a
        // screen reader actually observes), never the attribute, so
        // comparing it instead is not a weakened check — it is the
        // correct one, for the same reason `checked` already is.
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          attrs['value'] = el.value;
        }
        // Qwik's reconciler parks a `<Slot>`'s provided-but-not-currently-
        // rendered children in a hidden `<q:template q:slot>` element (e.g.
        // a component that returns `null` instead of `<Slot/>` while some
        // condition is false — see qwik-material/expansion's
        // MatExpansionPanelContent, the first consumer of this pattern in
        // the port). It is framework bookkeeping with no Angular
        // equivalent to diff against, the same category as the `q:*`/`on:*`
        // attribute prefixes and comment nodes already stripped above —
        // just a real element instead of a comment, so `el.children`
        // doesn't exclude it for free the way it excludes comments.
        const rawElementChildren = Array.from(el.children).filter(
          c => c.tagName.toLowerCase() !== 'q:template',
        );
        // A bare `<table><tr>...` (no `<thead>`/`<tbody>` at all — e.g. a plain `matSort` table
        // with no `mat-table`) gets an IMPLICIT, attribute-less `<tbody>` wrapping its `<tr>`s
        // when the browser's HTML parser builds it from SSR'd markup (Qwik's side here), but NOT
        // when a CSR framework builds the identical tree via imperative DOM calls (Angular's
        // dev-app, confirmed to have no SSR anywhere in this harness) — a standard HTML5
        // table-parsing rule, not a framework bug; already documented as a known,
        // library-level-unfixable gap in `qwik-material/sort/SYNC.md` deviation #4 ("The library
        // does not rewrite consumer markup... Consumers should write `<thead>`/`<tbody>`
        // explicitly"). Every one of THIS project's own `mat-sort` scenarios follows that advice
        // (explicit `<thead>`) — but an unmodified material.angular.dev docs example
        // (`sort-overview-example.html`) is real upstream source with no sections at all, so the
        // harness normalizes it here instead: a `<table>`'s direct `<tbody>` child with NO
        // attributes (the implicit-insertion signature — a REAL Material table's own `<tbody>`
        // always carries `role`/`class`, see `qwik-material/table`, and is never touched by this)
        // is transparent, splicing its own children in its place.
        const elementChildren =
          el.tagName.toLowerCase() === 'table'
            ? rawElementChildren.flatMap(c =>
                c.tagName.toLowerCase() === 'tbody' && c.attributes.length === 0
                  ? Array.from(c.children).filter(cc => cc.tagName.toLowerCase() !== 'q:template')
                  : [c],
              )
            : rawElementChildren;
        const node: Node = {
          tag: el.tagName.toLowerCase(),
          classes,
          attrs,
          styles: opts.compareStyles ? computedStyles(el) : {},
          children: elementChildren.map(walk),
        };
        if (elementChildren.length === 0) {
          // Direct text-node children only — NOT `el.textContent`, which
          // recurses through every descendant regardless of the
          // `q:template` filtering above (a hidden `<q:template>` child's
          // own text content would otherwise still leak into this leaf's
          // text, even though it isn't a counted/walked child).
          const text = Array.from(el.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent ?? '')
            .join('')
            .replace(/\s+/g, ' ')
            .trim();
          if (text) node.text = text;
        }
        return node;
      };
      return walk(root);
    },
    {
      ignoreAttrs: [...IGNORE_ATTRS, ...CONSUMER_SELECTOR_ATTRS, ...extraIgnoreAttrs],
      ignoreAttrPrefixes: IGNORE_ATTR_PREFIXES,
      ignoreClasses: IGNORE_CLASSES,
      idAttrs: ID_ATTRS,
      styleProps: COMPUTED_STYLE_PROPS,
      compareStyles: COMPARE_STYLES,
    },
  );
}

/** Resolves after two animation frames, letting pending renders flush. */
async function settle(page: Page): Promise<unknown> {
  await refreshHover(page);
  return page.evaluate(
    () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

/**
 * Re-sends a mouse move to the pointer's last real position. Chrome only re-evaluates `:hover`
 * under a STATIONARY pointer at certain moments (some layouts/animation ends), so content that
 * appears or moves under it (a menu overlapping its trigger, a field the click left the pointer
 * over) can report a stale `:hover` that depends on each app's timing — what any real pointer
 * movement would immediately correct. Only matters for computed-style comparison; the last
 * position is recorded by `TRACK_POINTER_SCRIPT`.
 */
async function refreshHover(page: Page): Promise<void> {
  if (!COMPARE_STYLES) return;
  const pos = await page.evaluate(
    () => (window as unknown as {__parityPointer?: {x: number; y: number}}).__parityPointer,
  );
  if (pos) await page.mouse.move(pos.x, pos.y);
}

const TRACK_POINTER_SCRIPT = () => {
  document.addEventListener(
    'mousemove',
    e => {
      (window as unknown as {__parityPointer: {x: number; y: number}}).__parityPointer = {
        x: e.clientX,
        y: e.clientY,
      };
    },
    true,
  );
};

/**
 * Waits for `MatFormField`'s own `mat-form-field-animations-enabled` class
 * (added ~300ms after mount, once, forever — mirrors upstream's
 * `ngAfterViewInit` `setTimeout`; see `qwik-material/form-field/
 * mat-form-field.tsx`'s own comment) to settle, on whichever page has a
 * `.mat-mdc-form-field` at all. A no-op (resolves immediately) for any
 * scenario without one.
 *
 * Needed specifically for components whose FIRST comparison (before any
 * interaction step) runs soon enough after navigation that this timer
 * genuinely hasn't fired yet on one side — confirmed live for
 * `mat-select`: unlike `mat-input`'s own scenarios (whose bundle is
 * smaller, so Qwik's SSR→resumability bootstrap finishes with more of the
 * 300ms margin already elapsed), select's substantially larger bundle
 * (overlay, key-manager, option/optgroup, form-field extensions) pushes
 * qwikloader's own bootstrap time close enough to the 300ms mark that the
 * class was consistently (not flakily — confirmed across repeated runs)
 * still absent by the time `expectMaterialParity`'s very first `compare()`
 * ran, on EVERY `mat-select` scenario. This does not weaken the
 * `mat-form-field-animations-enabled` assertion itself (the full class
 * list, including this one, is still compared after this resolves) — it
 * only waits for a known, real, transient mount-timer to settle first,
 * the same category of fix `waitForSelectPanel`'s own polling in
 * `specs/material-select/angular-parity.spec.ts` already applies to the
 * select panel's exit animation.
 *
 * Checks EVERY `.mat-mdc-form-field` on the page (`querySelectorAll` + `.every(...)`, not a
 * single `querySelector`) — a scenario with more than one form field (e.g. material.angular.dev's
 * `stepper-overview` docs example, two fields in two different steps) can have each one's
 * ~300ms timer land at a slightly different moment; checking only the first left the SECOND one's
 * class missing on the very first `compare()`, confirmed live. Same "wait for every matching
 * element, not just one" shape `specs/material-expansion/angular-parity.spec.ts`'s own `settle`
 * step already uses for `.mat-expansion-panel-animations-enabled`.
 */
async function waitForFormFieldAnimationsSettled(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () =>
        Array.from(document.querySelectorAll('.mat-mdc-form-field')).every(field =>
          field.classList.contains('mat-form-field-animations-enabled'),
        ),
      undefined,
      {timeout: 2000},
    )
    .catch(() => {});
}

const PIN_ROOT_CSS =
  '[data-parity-root]{position:fixed!important;top:40px!important;left:40px!important;' +
  'width:800px!important;margin:0!important;padding:0!important}';

/**
 * Google Fonts responses (both dev-apps load Roboto/Material Icons from fonts.googleapis.com /
 * fonts.gstatic.com), fetched once per worker and replayed from memory. Every test opens two
 * fresh contexts, so without this each one re-requests them, and a single slow response holds
 * up the page's `load` event until the test times out.
 */
type CachedResponse = {status: number; headers: Record<string, string>; body: Buffer};

/** In-memory layer (per worker) over the on-disk cache in `FONT_CACHE_DIR`. */
const FONT_CACHE = new Map<string, CachedResponse>();
/** URLs that failed to download this run: aborted immediately from then on. */
const FONT_FAILURES = new Set<string>();
/** Survives across runs (gitignored), so after one successful download no run needs the network. */
const FONT_CACHE_DIR = path.resolve('.font-cache');
/** Per-download timeout; raise it (`PARITY_FONT_TIMEOUT_MS=60000`) to prime the cache on a slow network. */
const FONT_FETCH_TIMEOUT_MS = Number(process.env['PARITY_FONT_TIMEOUT_MS'] ?? 8000);

function fontCacheFile(url: string): string {
  return path.join(FONT_CACHE_DIR, createHash('sha1').update(url).digest('hex'));
}

function readCachedFont(url: string): CachedResponse | undefined {
  const memo = FONT_CACHE.get(url);
  if (memo) return memo;
  const file = fontCacheFile(url);
  if (!existsSync(file)) return undefined;
  const {status, headers} = JSON.parse(readFileSync(`${file}.json`, 'utf8'));
  const hit = {status, headers, body: readFileSync(file)};
  FONT_CACHE.set(url, hit);
  return hit;
}

function writeCachedFont(url: string, hit: CachedResponse): void {
  FONT_CACHE.set(url, hit);
  mkdirSync(FONT_CACHE_DIR, {recursive: true});
  const file = fontCacheFile(url);
  // Metadata first, body last via rename: readers key off the body file, which appears atomically
  // (several workers may write the same entry concurrently).
  writeFileSync(`${file}.json`, JSON.stringify({status: hit.status, headers: hit.headers}));
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, hit.body);
  renameSync(tmp, file);
}

/**
 * Serves Google Fonts (both dev-apps load Roboto/Material Icons from fonts.googleapis.com /
 * fonts.gstatic.com) from a memory + on-disk cache. Every test opens two fresh contexts; fetching
 * per page let one slow or failed response hold up the page's `load` event until the test timed
 * out. A URL that can't be downloaded is aborted immediately for the rest of the run, so both
 * apps fall back to the same local fonts instead of hanging.
 */
async function cacheGoogleFonts(ctx: BrowserContext): Promise<void> {
  await ctx.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, async route => {
    const url = route.request().url();
    const cached = readCachedFont(url);
    if (cached) return route.fulfill(cached);
    if (FONT_FAILURES.has(url)) return route.abort('failed');
    try {
      const response = await route.fetch({timeout: FONT_FETCH_TIMEOUT_MS});
      const hit = {
        status: response.status(),
        headers: response.headers(),
        body: await response.body(),
      };
      if (response.ok()) writeCachedFont(url, hit);
      return route.fulfill(hit);
    } catch {
      FONT_FAILURES.add(url);
      return route.abort('failed').catch(() => {});
    }
  });
}

async function open(
  browser: Browser,
  url: string,
  pinRoot = false,
  clockDate?: Date | number | string,
): Promise<Page> {
  const ctx = await browser.newContext();
  await cacheGoogleFonts(ctx);
  const page = await ctx.newPage();
  if (clockDate !== undefined) await page.clock.setFixedTime(clockDate);
  if (COMPARE_STYLES) await page.addInitScript(TRACK_POINTER_SCRIPT);
  await page.goto(url);
  await page.waitForSelector('[data-parity-root]', {state: 'attached'});
  if (pinRoot) await page.addStyleTag({content: PIN_ROOT_CSS});
  await waitForFormFieldAnimationsSettled(page);
  return page;
}

/**
 * Gives the Qwik page Angular's exact theme, so computed colors/typography compare the
 * components' CSS rather than the two dev-apps' themes: every rule in Angular's stylesheets that
 * declares only custom properties (the `mat.theme()`/`all-component-themes` output, density and
 * color-variant classes) or is scoped to the dev-app shell's `.demo-*` classes is copied verbatim, with Angular's `<html>`/`<body>` classes so those
 * selectors match, plus `color-scheme` (values use `light-dark()`) and the inherited text styles
 * the Angular dev-app shell sets (body for overlays, the root for in-page content).
 */
async function syncTheme(angular: Page, qwik: Page): Promise<void> {
  const theme = await angular.evaluate(() => {
    const rules: string[] = [];
    const visit = (list: CSSRuleList, wrap: (css: string) => string) => {
      for (const rule of Array.from(list)) {
        if (rule instanceof CSSMediaRule) {
          visit(rule.cssRules, css => wrap(`@media ${rule.conditionText} { ${css} }`));
        } else if (rule instanceof CSSStyleRule && rule.style.length) {
          // Token-only rules (the theme), and rules scoped to the dev-app shell's own `.demo-*`
          // classes (e.g. experimental column-resize styles under `body.demo-experimental-theme`).
          const shellScoped = /(^|[\s>+~,])\S*\.demo-/.test(rule.selectorText);
          if (shellScoped || Array.from(rule.style).every(p => p.startsWith('--'))) {
            rules.push(wrap(rule.cssText));
          }
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        visit(sheet.cssRules, css => css);
      } catch {
        // Cross-origin sheet (e.g. fonts); has no theme rules.
      }
    }
    const textStyles = (el: Element) => {
      const style = getComputedStyle(el);
      return ['color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing']
        .map(p => `${p}: ${style.getPropertyValue(p)};`)
        .join(' ');
    };
    const root = document.querySelector('[data-parity-root]') ?? document.body;
    return {
      htmlClass: document.documentElement.className,
      bodyClass: document.body.className,
      css:
        rules.join('\n') +
        `\nhtml { color-scheme: ${getComputedStyle(document.body).colorScheme}; }` +
        `\nbody { ${textStyles(document.body)} }` +
        `\n[data-parity-root] { ${textStyles(root)} }`,
    };
  });
  await qwik.evaluate(({htmlClass, bodyClass}) => {
    for (const c of htmlClass.split(/\s+/).filter(Boolean))
      document.documentElement.classList.add(c);
    for (const c of bodyClass.split(/\s+/).filter(Boolean)) document.body.classList.add(c);
  }, theme);
  await qwik.addStyleTag({content: theme.css});
}

/** Asserts the Angular and Qwik renderings of a scenario are DOM-identical, before and after each step. */
export async function expectMaterialParity(browser: Browser, s: ParityScenario): Promise<void> {
  const angular = await open(
    browser,
    `${ANGULAR_URL}/${s.route}/${s.scenario}`,
    s.pinRoot,
    s.clockDate,
  );
  const qwik = await open(browser, `${QWIK_URL}/${s.route}/${s.scenario}/`, s.pinRoot, s.clockDate);
  // Qwik resumes lazily; make sure the scenario's own readiness marker exists.
  await qwik.waitForSelector('[data-scenario-ready]', {state: 'attached'});
  await syncTheme(angular, qwik);

  try {
    const compare = async (label: string) => {
      // A custom root (e.g. the overlay container) may not exist until a step
      // creates it; then both sides must agree that it is absent.
      const root = s.rootSelector ?? '[data-parity-root]';
      // Eventually-consistent compare (like Playwright's expect.poll): the
      // contract is the settled DOM, and a multi-hop reactive or lazily-rendered
      // update can need several frames to land on either side (polled for ~2s). A real difference still
      // fails after the last attempt; intermediate frames are never the contract.
      const deadline = Date.now() + 2000;
      let aCount = 0;
      let qCount = 0;
      let diffs: string[] = [];
      for (let attempt = 0; ; attempt++) {
        aCount = await angular.locator(root).count();
        qCount = await qwik.locator(root).count();
        if (aCount === qCount) {
          if (aCount === 0) return;
          diffs = diffNodes(
            await snapshotParityRoot(angular, s.rootSelector, s.ignoreAttrs),
            await snapshotParityRoot(qwik, s.rootSelector, s.ignoreAttrs),
          );
          if (diffs.length === 0) return;
        }
        if (Date.now() >= deadline) break;
        await Promise.all([settle(angular), settle(qwik)]);
        await angular.waitForTimeout(50);
      }
      expect(qCount, `${s.route}/${s.scenario} [${label}] count of ${root}`).toBe(aCount);
      expect(diffs, `${s.route}/${s.scenario} [${label}]\n${diffs.join('\n')}`).toEqual([]);
    };

    if (!s.skipInitialCompare) await compare('initial');
    for (const step of s.steps ?? []) {
      await step.run(angular);
      await step.run(qwik);
      // Angular's coalesced change detection (and Qwik's signal flush) can
      // land a frame or two after the interaction; snapshot after both settle.
      await Promise.all([settle(angular), settle(qwik)]);
      await compare(step.name);
    }
  } finally {
    await angular.context().close();
    await qwik.context().close();
  }
}
