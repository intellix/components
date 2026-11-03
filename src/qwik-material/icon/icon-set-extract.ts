/**
 * String-surgery port of `MatIconRegistry._extractSvgIconFromSet`/
 * `_toSvgElement` (`src/material/icon/icon-registry.ts`) — finds the
 * element with a given `id` inside a registered icon SET's raw SVG markup
 * and returns it as a standalone `<svg>...</svg>` string, the same way
 * `icon-svg-attrs.ts`'s `withIconSvgAttributes()` already does string
 * surgery instead of live DOM mutation for the single-icon case (no DOM to
 * parse into at SSR time; must behave identically there and in the
 * browser).
 *
 * Upstream, in order:
 *   1. `iconSet.querySelector('[id="iconName"]')` — exact-match lookup by id.
 *   2. Clone it, strip the `id` attribute (so the DOM never ends up with two
 *      elements sharing an id once more than one icon is pulled from the
 *      same set).
 *   3. If it's already an `<svg>`, return it as-is (sans id).
 *   4. If it's a `<symbol>` (the common case — icon sets are almost always
 *      `<symbol id="...">` elements, since `<use href="#id">` is
 *      problematic on Firefox with a `<base>` tag, per that method's own
 *      comment), convert it into an `<svg>` carrying the same attributes
 *      (sans id) and the same children.
 *   5. Otherwise (any other element, e.g. a bare `<path id="...">`), wrap it
 *      in a fresh, attribute-less `<svg>`.
 */

/** A tag found by {@link findOuterElementById}. */
interface FoundElement {
  tagName: string;
  /** The full open-tag text, e.g. `<symbol id="foo" viewBox="0 0 24 24">`. */
  openTag: string;
  /** Markup between the open and close tags. Empty for a self-closing tag. */
  inner: string;
  /** Whether the open tag was self-closing (`<tag ... />`), i.e. no `inner`/close tag. */
  selfClosing: boolean;
}

const TAG_NAME_RE = /^<\s*([a-zA-Z][a-zA-Z0-9:_-]*)/;

/**
 * Finds the element whose `id` attribute is exactly `id` (matching upstream's
 * `[id="iconName"]` CSS-selector semantics — exact value match, case-sensitive)
 * inside `markup`, and returns its parsed pieces, or `null` if no such
 * element exists.
 */
function findOuterElementById(markup: string, id: string): FoundElement | null {
  // Exact-value id match: `id="foo"` or `id='foo'`, not a substring of a
  // longer id. Requires a preceding tag-opening context (quick guard — the
  // real validation is "this occurs inside some element's attribute list",
  // which the backward scan below confirms).
  const idAttrRe = new RegExp(`\\sid\\s*=\\s*(["'])${escapeRegExp(id)}\\1`);
  const idMatch = idAttrRe.exec(markup);
  if (!idMatch) return null;

  // Scan backward from the id attribute to the start of ITS owning tag: the
  // nearest `<` not already closed by a `>` between it and the id match.
  let tagStart = -1;
  for (let i = idMatch.index; i >= 0; i--) {
    if (markup[i] === '>') break; // Walked past the previous tag's close — no owning tag.
    if (markup[i] === '<') {
      tagStart = i;
      break;
    }
  }
  if (tagStart === -1) return null;

  const nameMatch = TAG_NAME_RE.exec(markup.slice(tagStart));
  if (!nameMatch) return null;
  const tagName = nameMatch[1];

  // End of the OPENING tag (handles attribute values that might contain
  // '>' only if quoted — good enough for the controlled SVG content this
  // registry deals with, same trust boundary as the rest of this file).
  const openTagEnd = markup.indexOf('>', tagStart);
  if (openTagEnd === -1) return null;
  const openTag = markup.slice(tagStart, openTagEnd + 1);

  if (openTag.endsWith('/>')) {
    return {tagName, openTag, inner: '', selfClosing: true};
  }

  // Depth-counted scan for the matching close tag, so a DIFFERENT icon's
  // same-named sibling elsewhere in the set markup is never mistaken for
  // this one's close tag.
  const pairRe = new RegExp(`<${tagName}(?=[\\s/>])|</${tagName}\\s*>`, 'g');
  pairRe.lastIndex = openTagEnd + 1;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = pairRe.exec(markup))) {
    if (match[0].startsWith('</')) {
      depth--;
      if (depth === 0) {
        return {
          tagName,
          openTag,
          inner: markup.slice(openTagEnd + 1, match.index),
          selfClosing: false,
        };
      }
    } else {
      // Could itself be self-closing — a nested same-named self-closing tag
      // never opens a new depth level.
      const nestedEnd = markup.indexOf('>', match.index);
      if (nestedEnd !== -1 && markup.slice(nestedEnd - 1, nestedEnd + 1) === '/>') {
        pairRe.lastIndex = nestedEnd + 1;
        continue;
      }
      depth++;
    }
  }
  return null; // Unbalanced markup — treat as not found.
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Removes the `id="..."`/`id='...'` attribute from a single open-tag string. */
function stripIdAttribute(openTag: string): string {
  return openTag.replace(/\s+id\s*=\s*(["']).*?\1/, '');
}

/**
 * Parses an open tag's attribute list (excluding `id`, which the caller
 * already stripped) into a plain string suitable for splicing into a new
 * tag, e.g. turning `<symbol id="x" viewBox="0 0 24 24" fill="red">` into
 * ` viewBox="0 0 24 24" fill="red"` (leading space, `id` removed, tag name
 * and brackets removed) — used by the `<symbol>` → `<svg>` conversion,
 * which needs the SAME attributes on a DIFFERENT tag name.
 */
function attributesOf(openTag: string): string {
  const withoutId = stripIdAttribute(openTag);
  const nameMatch = TAG_NAME_RE.exec(withoutId)!;
  let rest = withoutId.slice(nameMatch[0].length, withoutId.endsWith('/>') ? -2 : -1);
  return rest.trim().length ? ` ${rest.trim()}` : '';
}

/**
 * Extracts the icon named `id` from a registered icon SET's raw markup
 * (`iconSetMarkup`, the full text of one `addSvgIconSet*`/
 * `addSvgIconSetInNamespace`/... registration), returning a standalone
 * `<svg>...</svg>` string (sans `id`), or `null` if no element with that id
 * exists in the set. Mirrors `_extractSvgIconFromSet`'s three cases — see
 * this module's doc comment.
 */
export function extractIconFromSetMarkup(iconSetMarkup: string, id: string): string | null {
  const found = findOuterElementById(iconSetMarkup, id);
  if (!found) return null;

  const {tagName, openTag, inner, selfClosing} = found;
  const strippedOpenTag = stripIdAttribute(openTag);

  if (tagName === 'svg') {
    return selfClosing ? strippedOpenTag : `${strippedOpenTag}${inner}</svg>`;
  }

  if (tagName === 'symbol') {
    // _toSvgElement: a fresh <svg> carrying the symbol's own attributes
    // (sans id) and the symbol's children verbatim.
    return `<svg${attributesOf(openTag)}>${inner}</svg>`;
  }

  // Any other element (e.g. a bare `<path id="...">`): wrap in a fresh,
  // attribute-less <svg>, keeping the element's own tag name/content.
  const wrapped = selfClosing ? strippedOpenTag : `${strippedOpenTag}${inner}</${tagName}>`;
  return `<svg>${wrapped}</svg>`;
}
