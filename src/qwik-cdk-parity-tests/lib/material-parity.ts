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

const ANGULAR_URL = 'http://localhost:4200/qwik-parity';
const QWIK_URL = 'http://localhost:4173';

const IGNORE_ATTRS = ['ng-version', 'data-qwik', 'data-scenario-ready'];
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
          attrs[name] = opts.idAttrs.includes(name) ? attr.value.replace(/\d+/g, '#') : attr.value;
        }
        const elementChildren = Array.from(el.children);
        const node: Node = {
          tag: el.tagName.toLowerCase(),
          classes,
          attrs,
          styles: {},
          children: elementChildren.map(walk),
        };
        if (elementChildren.length === 0) {
          const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (text) node.text = text;
        }
        return node;
      };
      return walk(root);
    },
    {
      ignoreAttrs: IGNORE_ATTRS,
      ignoreAttrPrefixes: IGNORE_ATTR_PREFIXES,
      ignoreClasses: IGNORE_CLASSES,
      idAttrs: ID_ATTRS,
    },
  );
}

async function open(browser: Browser, url: string): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForSelector('[data-parity-root]');
  return page;
}

/** Asserts the Angular and Qwik renderings of a scenario are DOM-identical, before and after each step. */
export async function expectMaterialParity(browser: Browser, s: ParityScenario): Promise<void> {
  const angular = await open(browser, `${ANGULAR_URL}/${s.route}/${s.scenario}`);
  const qwik = await open(browser, `${QWIK_URL}/${s.route}/${s.scenario}/`);
  // Qwik resumes lazily; make sure the scenario's own readiness marker exists.
  await qwik.waitForSelector('[data-scenario-ready]');

  try {
    const compare = async (label: string) => {
      const diffs = diffNodes(
        await snapshotParityRoot(angular, s.rootSelector),
        await snapshotParityRoot(qwik, s.rootSelector),
      );
      expect(diffs, `${s.route}/${s.scenario} [${label}]\n${diffs.join('\n')}`).toEqual([]);
    };

    await compare('initial');
    for (const step of s.steps ?? []) {
      await step.run(angular);
      await step.run(qwik);
      await compare(step.name);
    }
  } finally {
    await angular.context().close();
    await qwik.context().close();
  }
}
