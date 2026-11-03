/**
 * SVG attributes `MatIconRegistry._setSvgAttributes` applies to every registered
 * icon's root `<svg>` element (src/material/icon/icon-registry.ts):
 *
 *   svg.setAttribute('fit', '');
 *   svg.setAttribute('height', '100%');
 *   svg.setAttribute('width', '100%');
 *   svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
 *   svg.setAttribute('focusable', 'false');
 *
 * Upstream applies these via `setAttribute` on a live `SVGElement` after
 * parsing the registered markup, on top of whatever attributes the literal
 * already carries (`viewBox`, `aria-hidden`, …) — it never replaces the whole
 * element. This port has no live `SVGElement` to mutate: `svgLiteral` is
 * injected via `dangerouslySetInnerHTML`, identically at SSR and in the
 * browser, so the same five attributes are stitched into the opening `<svg>`
 * tag's markup instead. A pre-existing occurrence of one of these attributes
 * in the consumer's literal is replaced, matching `setAttribute`'s overwrite
 * semantics; every other attribute passes through untouched.
 */
const ICON_SVG_ATTRS: ReadonlyArray<readonly [name: string, value: string]> = [
  ['fit', ''],
  ['height', '100%'],
  ['width', '100%'],
  ['preserveAspectRatio', 'xMidYMid meet'],
  ['focusable', 'false'],
];

/**
 * Applies the upstream `_setSvgAttributes` attribute set to a raw SVG
 * string's root `<svg>` tag. `viewBox`, when given, reproduces that same
 * method's `if (options && options.viewBox) svg.setAttribute('viewBox',
 * options.viewBox)` — the registry's `IconOptions.viewBox` override, applied
 * ONLY by the registry path (`icon-registry.ts`); the standalone
 * `svgLiteral` prop never had an options bag to carry one, so that call
 * site keeps passing no override, same as before this parameter existed.
 */
export function withIconSvgAttributes(svgLiteral: string, viewBox?: string): string {
  const attrs: ReadonlyArray<readonly [name: string, value: string]> = viewBox
    ? [...ICON_SVG_ATTRS, ['viewBox', viewBox]]
    : ICON_SVG_ATTRS;
  return svgLiteral.replace(/<svg\b([^>]*)>/, (_match, rawAttrs: string) => {
    let rest = rawAttrs;
    for (const [name] of attrs) {
      rest = rest.replace(new RegExp(`\\s+${name}\\s*=\\s*("[^"]*"|'[^']*')`, 'i'), '');
    }
    const appended = attrs.map(([name, value]) => ` ${name}="${value}"`).join('');
    return `<svg${rest}${appended}>`;
  });
}
