import {expect, type Browser, type Page} from '@playwright/test';
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
 * Qwik `q:*`, `on:*`, comments). Auto-generated ids keep their shape but
 * have digits replaced with `#`, because Angular's counters are app-global.
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
];
const IGNORE_ATTR_PREFIXES = [
  '_ngcontent-',
  '_nghost-',
  'ng-reflect-',
  'q:',
  'on:',
  'on-document:',
  'on-window:',
];
const IGNORE_CLASSES = ['ng-star-inserted'];
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
}

/** Captures the `[data-parity-root]` subtree as a normalized DomNode. */
export async function snapshotParityRoot(
  page: Page,
  rootSelector = '[data-parity-root]',
): Promise<DomNode> {
  // Transient ripple elements are timing-dependent; wait them out.
  await page
    .waitForFunction(() => !document.querySelector('.mat-ripple-element'), undefined, {
      timeout: 3000,
    })
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
              .map(prop => `${prop}: ${style.getPropertyValue(prop)}`)
              .sort();
            if (decls.length) attrs[name] = decls.join('; ');
            continue;
          }
          attrs[name] = opts.idAttrs.includes(name) ? normalizeIdValue(attr.value) : attr.value;
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
        const elementChildren = Array.from(el.children).filter(
          c => c.tagName.toLowerCase() !== 'q:template',
        );
        const node: Node = {
          tag: el.tagName.toLowerCase(),
          classes,
          attrs,
          styles: {},
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
      ignoreAttrs: [...IGNORE_ATTRS, ...CONSUMER_SELECTOR_ATTRS],
      ignoreAttrPrefixes: IGNORE_ATTR_PREFIXES,
      ignoreClasses: IGNORE_CLASSES,
      idAttrs: ID_ATTRS,
    },
  );
}

/** Resolves after two animation frames, letting pending renders flush. */
function settle(page: Page): Promise<unknown> {
  return page.evaluate(
    () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

async function open(browser: Browser, url: string): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForSelector('[data-parity-root]', {state: 'attached'});
  return page;
}

/** Asserts the Angular and Qwik renderings of a scenario are DOM-identical, before and after each step. */
export async function expectMaterialParity(browser: Browser, s: ParityScenario): Promise<void> {
  const angular = await open(browser, `${ANGULAR_URL}/${s.route}/${s.scenario}`);
  const qwik = await open(browser, `${QWIK_URL}/${s.route}/${s.scenario}/`);
  // Qwik resumes lazily; make sure the scenario's own readiness marker exists.
  await qwik.waitForSelector('[data-scenario-ready]', {state: 'attached'});

  try {
    const compare = async (label: string) => {
      // A custom root (e.g. the overlay container) may not exist until a step
      // creates it; then both sides must agree that it is absent.
      const root = s.rootSelector ?? '[data-parity-root]';
      const [aCount, qCount] = [
        await angular.locator(root).count(),
        await qwik.locator(root).count(),
      ];
      expect(qCount, `${s.route}/${s.scenario} [${label}] count of ${root}`).toBe(aCount);
      if (aCount === 0) return;
      const diffs = diffNodes(
        await snapshotParityRoot(angular, s.rootSelector),
        await snapshotParityRoot(qwik, s.rootSelector),
      );
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
