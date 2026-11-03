/**
 * Explicit "I trust this" wrappers for the two places the SVG icon registry
 * accepts raw content from the app: a URL to fetch, and an HTML string to
 * inject directly. Mirrors upstream `MatIconRegistry`'s security model
 * (`src/material/icon/icon-registry.ts`): every `addSvgIcon*`/
 * `addSvgIconSet*` method there requires a `SafeResourceUrl`/`SafeHtml`
 * produced by Angular's `DomSanitizer.bypassSecurityTrustResourceUrl()` /
 * `bypassSecurityTrustHtml()` — a value you can only get by EXPLICITLY
 * calling a function named "bypass... trust", never by passing a plain
 * string. This port has no `DomSanitizer` (no Angular DI, and nothing
 * sanitizes the HTML either — see deviation below), so the same contract is
 * reproduced with a pair of small branded-object wrappers instead: every
 * registry method that accepts a URL or an HTML literal requires one of
 * these, not a plain `string`, so a consumer can't pass arbitrary untrusted
 * content into `dangerouslySetInnerHTML` by accident — they have to
 * explicitly call `trustIconResourceUrl()`/`trustIconHtml()` first, which is
 * the opt-in this module exists to force.
 *
 * Deviation from upstream: these wrappers do NOT sanitize anything (upstream
 * doesn't either, once content clears `DomSanitizer` — `bypassSecurityTrust*`
 * is explicitly a sanitizer BYPASS, not a sanitizer). Calling
 * `trustIconHtml(userInput)` on a string an app did not fully control would
 * be exactly as unsafe as Angular's own `bypassSecurityTrustHtml(userInput)`
 * — never wrap unsanitized, untrusted (e.g. user-submitted) content with
 * either function. Icon URLs are fetched with the platform's `fetch()` (see
 * `icon-fetch.ts`) and injected verbatim, same as upstream's `HttpClient`
 * response.
 */

const TRUSTED_URL_BRAND = 'qwikMaterial/trustedIconResourceUrl' as const;
const TRUSTED_HTML_BRAND = 'qwikMaterial/trustedIconHtml' as const;

/** A URL the caller has explicitly marked as safe to fetch and inject as an icon. */
export interface TrustedResourceUrl {
  readonly brand: typeof TRUSTED_URL_BRAND;
  readonly url: string;
}

/** An HTML string the caller has explicitly marked as safe to inject verbatim as an icon. */
export interface TrustedHtml {
  readonly brand: typeof TRUSTED_HTML_BRAND;
  readonly html: string;
}

/**
 * Marks a URL as trusted to fetch and inject as an icon's `<svg>` markup.
 * The upstream equivalent of `sanitizer.bypassSecurityTrustResourceUrl(url)`
 * (see `icon-svg/icon-svg-example.ts`'s own comment on that upstream call).
 * Only call this with a URL your app controls (your own asset, your own
 * API's response) — never with an unvalidated URL from user input.
 */
export function trustIconResourceUrl(url: string): TrustedResourceUrl {
  return {brand: TRUSTED_URL_BRAND, url};
}

/**
 * Marks an HTML string as trusted to inject verbatim as an icon's `<svg>`
 * markup. The upstream equivalent of `sanitizer.bypassSecurityTrustHtml(svg)`
 * (see `icon-svg/icon-svg-example.ts`'s upstream source). Only call this
 * with markup your app authored or otherwise fully controls — never with
 * unsanitized user input.
 */
export function trustIconHtml(html: string): TrustedHtml {
  return {brand: TRUSTED_HTML_BRAND, html};
}

/** @docs-private */
export function isTrustedResourceUrl(value: unknown): value is TrustedResourceUrl {
  return !!value && (value as TrustedResourceUrl).brand === TRUSTED_URL_BRAND;
}

/** @docs-private */
export function isTrustedHtml(value: unknown): value is TrustedHtml {
  return !!value && (value as TrustedHtml).brand === TRUSTED_HTML_BRAND;
}
