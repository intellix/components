import type {QRL, Signal} from '@qwik.dev/core';

/**
 * Directive hooks — "Composing directives" in `qwik-material/README.md`.
 *
 * Upstream Angular Material lets several attribute directives sit on one
 * element at once (`<button matButton [matMenuTriggerFor]="menu"
 * matTooltip="Info" matBadge="4">`). This port's components each render AND
 * own their own host element (design doc rule 4: polymorphic `as` prop,
 * intrinsic tags only), so two of them can never be nested inside each
 * other without adding a wrapper element — which would break DOM parity.
 *
 * The fix: directive-shaped features (`useMatMenuTrigger`, `useMatTooltip`,
 * `useMatBadge`, `useMatStepperNext`/`useMatStepperPrevious`) are hooks that
 * return a `HostProps` bag — exactly what the real Angular directive would
 * have contributed to the consumer's own element — instead of a
 * component that renders a host itself. The CALLER decides what actually
 * owns the element (a plain native tag, or `MatButton`/`MatIconButton`/
 * `MatIcon`/… — any "host component" that merges incoming `HostProps` with
 * its own), and wires the result on with either a direct spread (one hook)
 * or `mergeHostProps()` (two or more).
 *
 * Both of these are the OUTPUT of this module:
 *
 *  - `HostProps`: a plain bag of real JSX prop names (`class`, `onClick$`,
 *    `aria-haspopup`, `ref`, …) — never a nested shape a consumer would need
 *    special code to unpack, so `<button {...trigger.hostProps}>` and
 *    `<MatButton {...trigger.hostProps}>` both just work: Qwik's own JSX
 *    spread assigns each key as that real prop.
 *  - `mergeHostProps(...parts)`: combines two or more `HostProps` into ONE,
 *    for when a consumer composes more than one directive onto the same
 *    element (`<MatButton {...mergeHostProps(trigger, tip)}>`).
 *
 * ## Why not just spread two `HostProps` directly in JSX?
 *
 * `<button {...a} {...b}>` is a plain object spread — same as React's, Qwik
 * doesn't do anything special with it. Whichever key exists in BOTH `a` and
 * `b` is decided purely by spread order: `b`'s value replaces `a`'s
 * outright. Two directives that both set `onClick$`/`class`/`aria-*` would
 * silently lose one side — exactly the bug this module exists to prevent.
 * `mergeHostProps()` is the one place that composes correctly: classes
 * concatenate, same-named event handlers compose (both run), `ref`s compose
 * (every hook that needs the live element gets it), and every other
 * attribute merges with later arguments winning only when they actually set
 * a value (an `undefined` from a hook that doesn't care about some
 * attribute never clobbers an earlier hook's real value).
 *
 * ## Why not an explicit `host={[trigger, tip]}` prop instead?
 *
 * That was the other shape the design doc considered. Rejected because it
 * would require EVERY host component (and every native element a directive
 * might sit on) to grow bespoke code recognizing a `host` prop and manually
 * re-implementing this exact merge internally — the array shape doesn't
 * typecheck or spread onto a native `<button>` at all, failing "native
 * elements must also work" outright. A plain, flat, pre-merged `HostProps`
 * object needs ZERO special-case code in a native element (a spread is a
 * spread) and lets host components stay almost unchanged: `MatButton`
 * already concatenates an incoming `class` prop with its own internal
 * classes and already wraps an incoming `onClick$`; this module only adds
 * the handful of NEW prop names (`ref`, `onMouseDown$`, `onKeyDown$`, …)
 * host components need to also forward, documented per-component in each
 * SYNC.md.
 *
 * ## Why this is Qwik-serialization-safe
 *
 * `mergeHostProps()` never wraps a composed handler in a NEW `$()` closure
 * (a generic "call these N QRLs" helper created fresh per call site would
 * need the Qwik optimizer to statically find and extract THAT exact
 * call — it can't, for a helper invoked from arbitrary call sites with a
 * dynamic argument list; see the pitfall this project has hit before with
 * component-local plain helpers shared across `$()` closures). Instead it
 * relies on a feature already built into Qwik itself: every `on<Event>$`
 * JSX prop accepts not just one `QRL`, but `QRL | QRL[] | null | undefined`
 * (recursively — Qwik's own `QRLEventHandlerMulti` type), and calls every
 * QRL in the array when the event fires. `mergeHostProps()` just
 * concatenates those arrays — composing handlers is something `<button
 * onClick$={[a, b]}>` already does natively, with no new serialization
 * surface at all. `ref`s compose differently (Qwik's `Ref` type has no
 * array form), via a small plain (non-`$()`) function created fresh per
 * render — safe because a `ref` callback runs synchronously the moment its
 * element mounts, in the same live call stack that created it, and is
 * never persisted across a resume boundary the way a QRL closure must be.
 */

/** The same shape Qwik's own `ref` JSX prop accepts (`Ref<EL>` in `@qwik.dev/core`,
 *  not itself exported, so re-declared structurally here). */
export type HostRef<EL extends Element = Element> =
  | Signal<Element | undefined>
  | ((el: EL) => void);

/**
 * The same shape Qwik's own `on<Event>$` JSX props accept
 * (`QRLEventHandlerMulti` in `@qwik.dev/core`, not itself exported, so
 * re-declared structurally here): a single handler QRL, or (possibly
 * nested) arrays of them — every one runs, in order, when the event fires.
 */
export type HostHandler<T extends Event = Event, EL extends Element = Element> =
  | QRL<(event: T, el: EL) => void>
  | null
  | undefined
  | HostHandler<T, EL>[];

/**
 * What a directive hook contributes to its eventual host element —
 * attributes (`aria-*`, `mat-*`, `role`, `tabIndex`, …), classes, event
 * handlers, and a `ref` when the directive needs the live element. See this
 * module's doc comment for the full rationale and `qwik-material/README.md`
 * ("Composing directives") for worked examples.
 *
 * Deliberately NOT part of this bag: a directive's own extra rendered
 * CONTENT (`useMatBadge()`'s `.mat-badge-content` span) or any overlay/
 * portal it owns (a menu's panel, a tooltip's floating panel) — neither is
 * a host ATTRIBUTE, so neither can be "spread" onto one. Each hook returns
 * those as separate fields on its own result (e.g. `useMatBadge(...).content`)
 * for the caller to place explicitly, the same way `<MatMenu/>` / the
 * tooltip's panel are already rendered as siblings today, and the same way
 * `MatButton`/`MatIcon`'s former `trailingContent` prop (now `hostContent`)
 * worked.
 */
export interface HostProps {
  ref?: HostRef;
  // Intentionally a MUTABLE array type (matching Qwik's own `ClassList`,
  // which is itself `string | ... | ClassList[]`, not `ReadonlyArray`) —
  // spreading `hostProps` directly onto a native element's `class` prop
  // requires that exact shape; a `ReadonlyArray` here fails to typecheck
  // against it even though every value this module ever produces is, in
  // practice, a freshly-built array no one else holds a reference to.
  class?: string | Array<string | false | null | undefined>;
  style?: string | Record<string, string | number>;
  onClick$?: HostHandler<MouseEvent>;
  onKeyDown$?: HostHandler<KeyboardEvent>;
  onKeyUp$?: HostHandler<KeyboardEvent>;
  onMouseDown$?: HostHandler<MouseEvent>;
  onMouseEnter$?: HostHandler<MouseEvent>;
  onMouseLeave$?: HostHandler<MouseEvent>;
  onPointerDown$?: HostHandler<PointerEvent>;
  onFocusIn$?: HostHandler<FocusEvent>;
  onFocusOut$?: HostHandler<FocusEvent>;
  onWheel$?: HostHandler<WheelEvent>;
  onTouchStart$?: HostHandler<TouchEvent>;
  onTouchEnd$?: HostHandler<TouchEvent>;
  onTouchCancel$?: HostHandler<TouchEvent>;
  /** Arbitrary extras: `aria-*`, `role`, `tabIndex`, `id`, `mat-*`/`data-*`
   *  attributes, or any other `on<Event>$` the named fields above don't
   *  call out explicitly — still composed correctly by `mergeHostProps()`
   *  (event-shaped keys detected by name, everything else merged with
   *  later-wins-if-defined semantics). */
  [key: string]: unknown;
}

const EVENT_KEY_RE = /^(?:document:|window:)?on[A-Z]/;

function isEventKey(key: string): boolean {
  return EVENT_KEY_RE.test(key);
}

function toClassArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return (value as unknown[]).filter(Boolean) as string[];
  return [value as string];
}

function toHandlerArray(value: HostHandler | undefined): QRL<(e: Event, el: Element) => void>[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(v => toHandlerArray(v));
  return [value];
}

function composeRef(refs: Array<HostRef | undefined>): HostRef | undefined {
  const defined = refs.filter((r): r is HostRef => r != null);
  if (defined.length === 0) return undefined;
  if (defined.length === 1) return defined[0];
  // Plain function, not `$()` — see this module's doc comment for why that's
  // safe: it runs synchronously when the element mounts, in the same live
  // call stack `mergeHostProps()` ran in, never serialized/resumed later.
  return (el: Element) => {
    for (const ref of defined) {
      if (typeof ref === 'function') {
        (ref as (el: Element) => void)(el);
      } else {
        (ref as Signal<Element | undefined>).value = el;
      }
    }
  };
}

function mergeStyle(a: HostProps['style'], b: HostProps['style']): HostProps['style'] {
  if (a == null) return b;
  if (b == null) return a;
  if (typeof a === 'object' && typeof b === 'object') return {...a, ...b};
  // One (or both) sides is a raw CSS string — no reliable way to merge two
  // style strings' individual declarations, so the later one simply wins.
  // Not hit by any current hook (none of `useMatMenuTrigger`/`useMatTooltip`/
  // `useMatBadge`/the stepper hooks set `style`); documented here for the
  // first future hook that does.
  return b;
}

/**
 * What `mergeHostProps()` accepts for each part: a `HostProps`, or anything
 * close enough to one — in practice, this project's various components'
 * OWN `class`/`style` prop types (`string | ReadonlyArray<string>`, from
 * before `HostProps` existed), which are read-only only because nothing
 * ever mutated them in place, not because they're a different shape. The
 * merge always copies into a fresh mutable array/object regardless, so
 * accepting either costs nothing.
 */
export type HostPropsLike = Omit<HostProps, 'class'> & {
  class?: string | ReadonlyArray<string | false | null | undefined> | HostProps['class'];
};

/**
 * Combines two or more hooks' `HostProps` into one, ready to spread onto a
 * single element (`<MatButton {...mergeHostProps(trigger, tip)}>` or
 * `<button {...mergeHostProps(trigger, tip)}>`). See this module's doc
 * comment for the full rationale. Safe (a no-op copy) to call with a single
 * `HostProps` too, so callers composing a variable number of directives
 * never need to special-case the single-hook case.
 */
export function mergeHostProps(...parts: Array<HostPropsLike | undefined | null>): HostProps {
  const merged: HostProps = {};
  const classes: string[] = [];
  const refs: Array<HostRef | undefined> = [];
  const handlerLists = new Map<string, QRL<(e: Event, el: Element) => void>[]>();

  for (const part of parts) {
    if (!part) continue;
    for (const key of Object.keys(part)) {
      const value = part[key];
      if (key === 'class') {
        classes.push(...toClassArray(value as HostProps['class']));
        continue;
      }
      if (key === 'ref') {
        refs.push(value as HostRef | undefined);
        continue;
      }
      if (key === 'style') {
        merged.style = mergeStyle(merged.style, value as HostProps['style']);
        continue;
      }
      if (isEventKey(key)) {
        const list = handlerLists.get(key) ?? [];
        list.push(...toHandlerArray(value as HostHandler));
        handlerLists.set(key, list);
        continue;
      }
      // A later part's `undefined` never clobbers an earlier part's real
      // value (the documented precedence rule) — BUT the key must still end
      // up present on `merged`, even when EVERY part's value for it is
      // `undefined`. Dropping it outright (`delete merged[key]` / never
      // assigning it) would mean the final host component sometimes spreads
      // an object that has this key and sometimes one that simply lacks it,
      // across renders of the SAME element — confirmed live to leave a
      // stale attribute on the real DOM after a client re-render flips the
      // value to `undefined` (`aria-controls` surviving a menu close): this
      // is the same family of bug `internal/ripple-loader.ts`'s
      // `rippleLoaderHostAttrs()` doc comment already documents for a plain
      // (non-merged) spread prop, just triggered here by the key's
      // PRESENCE changing across renders rather than merely its value.
      if (value !== undefined || !(key in merged)) merged[key] = value;
    }
  }

  if (classes.length) merged.class = classes;
  const ref = composeRef(refs);
  if (ref) merged.ref = ref;
  for (const [key, list] of handlerLists) {
    if (list.length) merged[key] = list.length === 1 ? list[0] : list;
  }
  return merged;
}

/**
 * Invokes a `HostHandler` value (a single QRL, or Qwik's own
 * `QRLEventHandlerMulti`-shaped nested arrays of them) — for a host
 * component's OWN handler to call an incoming directive-hook handler it
 * received as a prop, the same way `MatButton` already calls a plain
 * `props.onClick$` today, except now that prop may be an array (once
 * `mergeHostProps()` has composed two directives' `onClick$`s together)
 * rather than always a single QRL. A plain exported function, not a `$()` —
 * it's called FROM INSIDE another `$()` handler's body (e.g. `MatButton`'s
 * disabled-click guard), and a plain module-level function (as opposed to a
 * component-local closure) crosses that boundary fine, same as any other
 * plain helper this project already imports into multiple `$()` closures.
 */
export async function callHostHandler<T extends Event, EL extends Element = Element>(
  handler: HostHandler<T, EL> | undefined,
  event: T,
  el: EL,
): Promise<void> {
  if (handler == null) return;
  if (Array.isArray(handler)) {
    for (const h of handler) await callHostHandler(h, event, el);
    return;
  }
  await handler(event, el);
}

/**
 * Picks the props NOT in `knownKeys` out of a component's raw `props`
 * object — the generic "extra `aria-*`/`data-*`/`mat-*` attribute" escape
 * hatch host components (`MatButton` and friends) spread onto their own
 * rendered element so a directive hook can set an attribute the host
 * component has no dedicated named prop for (`aria-haspopup`,
 * `aria-expanded`, `aria-controls`, …) without that host component growing
 * a new named prop per directive. `undefined` values are dropped so they
 * never fight with a host component's own explicit, later-rendered
 * attribute (see each host component's own doc comment for the precedence
 * rule it uses for the handful of attributes it DOES already name, e.g.
 * `aria-describedby`).
 */
export function extraHostAttrs(
  props: Record<string, unknown>,
  knownKeys: ReadonlySet<string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key in props) {
    if (!knownKeys.has(key) && props[key] !== undefined) out[key] = props[key];
  }
  return out;
}
