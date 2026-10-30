import type {Locator} from '@playwright/test';

export interface DomNode {
  tag: string;
  classes: string[];
  attrs: Record<string, string>;
  styles: Record<string, string>;
  children: DomNode[];
  text?: string;
}

const IGNORE_ATTRS = new Set(['ng-version', 'data-overlay-id', 'id', 'style']);
const IGNORE_ATTR_PREFIXES = ['_ngcontent-', '_nghost-', 'ng-reflect-', 'data-q'];
const IGNORE_CLASS_PREFIXES = ['ng-reflect-', '_ngcontent-', '_nghost-'];
const KEEP_STYLES = [
  'display',
  'position',
  'z-index',
  'width',
  'height',
  'top',
  'left',
  'transform',
  'opacity',
];

/** Captures a serializable DOM tree from a Playwright Locator. Runs in browser context. */
export async function snapshot(loc: Locator): Promise<DomNode> {
  return loc.evaluate(
    (
      el: Element,
      opts: {
        keepStyles: string[];
        ignoreAttrs: string[];
        ignoreAttrPrefixes: string[];
        ignoreClassPrefixes: string[];
      },
    ) => {
      function walk(node: Element): {
        tag: string;
        classes: string[];
        attrs: Record<string, string>;
        styles: Record<string, string>;
        children: ReturnType<typeof walk>[];
        text?: string;
      } {
        const tag = node.tagName.toLowerCase();

        // Classes — filter framework-internal prefixes
        const classes = Array.from(node.classList).filter(
          cls => !opts.ignoreClassPrefixes.some(p => cls.startsWith(p)),
        );

        // Attributes — filter ignore list and ignore prefixes
        const attrs: Record<string, string> = {};
        for (const attr of Array.from(node.attributes)) {
          if (opts.ignoreAttrs.includes(attr.name)) continue;
          if (opts.ignoreAttrPrefixes.some(p => attr.name.startsWith(p))) continue;
          if (attr.name === 'class') continue; // captured separately
          attrs[attr.name] = attr.value;
        }

        // Styles from getComputedStyle — only the specified subset
        const computed = getComputedStyle(node);
        const styles: Record<string, string> = {};
        for (const prop of opts.keepStyles) {
          const val = computed.getPropertyValue(prop).trim();
          if (val) styles[prop] = val;
        }

        // Children — skip text/comment nodes; capture text when node has only text children
        const childElements: Element[] = [];
        let textContent: string | undefined;
        let hasOnlyTextChildren = true;
        for (const child of Array.from(node.childNodes)) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            childElements.push(child as Element);
            hasOnlyTextChildren = false;
          }
        }
        if (hasOnlyTextChildren && node.textContent) {
          const trimmed = node.textContent.trim();
          if (trimmed) textContent = trimmed;
        }

        const children = childElements.map(c => walk(c));
        const result: ReturnType<typeof walk> = {tag, classes, attrs, styles, children};
        if (textContent !== undefined) result.text = textContent;
        return result;
      }

      return walk(el);
    },
    {
      keepStyles: KEEP_STYLES,
      ignoreAttrs: Array.from(IGNORE_ATTRS),
      ignoreAttrPrefixes: IGNORE_ATTR_PREFIXES,
      ignoreClassPrefixes: IGNORE_CLASS_PREFIXES,
    },
  );
}

/** Recursively diffs two DomNode trees, returning human-readable difference strings. */
export function diffNodes(a: DomNode, b: DomNode, path = 'root'): string[] {
  const diffs: string[] = [];

  if (a.tag !== b.tag) {
    diffs.push(`${path}: tag '${a.tag}' != '${b.tag}'`);
    // Tags differ — stop recursing this branch to avoid noise
    return diffs;
  }

  const aCls = [...a.classes].sort().join(' ');
  const bCls = [...b.classes].sort().join(' ');
  if (aCls !== bCls) {
    diffs.push(`${path}: classes [${aCls}] != [${bCls}]`);
  }

  // Attrs
  const attrKeys = new Set([...Object.keys(a.attrs), ...Object.keys(b.attrs)]);
  for (const k of attrKeys) {
    if (a.attrs[k] !== b.attrs[k]) {
      diffs.push(`${path}: attr '${k}' '${a.attrs[k]}' != '${b.attrs[k]}'`);
    }
  }

  // Styles
  const styleKeys = new Set([...Object.keys(a.styles), ...Object.keys(b.styles)]);
  for (const k of styleKeys) {
    if (a.styles[k] !== b.styles[k]) {
      const cls = a.classes.length ? `.${a.classes.join('.')}` : '';
      diffs.push(`${path}${cls}: style '${k}' '${a.styles[k]}' != '${b.styles[k]}'`);
    }
  }

  // Text
  if (a.text !== b.text) {
    diffs.push(`${path}: text '${a.text}' != '${b.text}'`);
  }

  // Children
  if (a.children.length !== b.children.length) {
    diffs.push(`${path}: child count ${a.children.length} != ${b.children.length}`);
  }

  const minLen = Math.min(a.children.length, b.children.length);
  for (let i = 0; i < minLen; i++) {
    const childPath = `${path}>${a.children[i].tag}[${i}]`;
    diffs.push(...diffNodes(a.children[i], b.children[i], childPath));
  }

  return diffs;
}
