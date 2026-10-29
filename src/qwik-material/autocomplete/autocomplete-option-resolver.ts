/**
 * Resolves `MatAutocomplete`'s `options` prop into the flat, synchronous
 * data the trigger needs for keyboard navigation, selection, and the
 * `<MatOptgroup>`/`<MatOption>` tree rendered inside `MatAutocompletePanel`.
 *
 * `options` is a PLAIN-DATA array, same shape family as
 * `qwik-material/select`'s `MatSelectOptionDef`/`MatSelectGroupDef` and for
 * the SAME reason (see that package's `select-option-resolver.ts` doc
 * comment for the full "why plain data, not `<MatOption>` JSX elements"
 * write-up) — this port's `MatAutocomplete` also needs the resolved data
 * again inside its own lazily-resumed `$()` handlers.
 *
 * ## Why this file can't just copy select's "resolve once, memoize forever" trick
 *
 * `select-option-resolver.ts`'s `resolveSelectOptions()` is called exactly
 * once per `MatSelect` instance, memoized via `useSignal(() => ...)` —
 * select's own `options` prop never changes after mount (see that file's
 * SYNC.md). Autocomplete's `options` prop is DELIBERATELY reactive: every
 * scenario in this port's parity suite re-renders `<MatAutocomplete
 * options={filteredFruits.value}>` on every keystroke, with a brand new
 * filtered array each time (mirrors Angular's own `@for (… of
 * filteredFruits)`, re-evaluated on every change). A single `useSignal(()
 * => resolveAutocompleteOptions(...))` would freeze the FIRST render's
 * option list forever — wrong.
 *
 * So `resolveAutocompleteOptions()` is designed to be called FRESH on every
 * render, re-deriving `tree`/`flat` from whatever `options` currently is —
 * cheap (a handful of array operations, no DOM, no measurement). The one
 * thing that must NOT happen on every call is minting a brand new id for an
 * option that already had one — `@for (… track fruit)` keeps the SAME
 * `MatOption` instance (and thus the same constructor-assigned id) alive
 * across a refilter that still includes that value (confirmed live — see
 * `src/dev-app/qwik-parity/autocomplete.ts`'s FILTERING header note). This
 * file reproduces that id STABILITY with an explicit, caller-owned
 * `idCache: Map<string, string>` keyed by each entry's resolved identity
 * (`def.id` if given, else `def.key` if given, else `String(def.value)` for
 * a primitive, else `def.label` — see `entryKey()`) — a value whose key is
 * already in the cache reuses its id; a genuinely NEW key (one never seen
 * before by THIS cache) mints a fresh one via `idGen.getId(...)` and
 * remembers it for next time.
 *
 * `idCache` is deliberately NOT the shared, context-provided, REACTIVE
 * `useIdGenerator()` counter signal (`qwik-cdk/a11y`'s `ID_GENERATOR_COUNTER`)
 * — see `mat-autocomplete.tsx`'s doc comment for why minting through that
 * counter from inside a component's own render body is the exact hazard
 * `mat-select.tsx`'s "id-generator infinite loop" doc comment warns about
 * (reading+writing a context signal during a tracked render subscribes the
 * component to its own write). `idGen` here is instead a plain,
 * NON-reactive `IdGenerator` (`qwik-cdk/a11y`'s `createIdGenerator()` — a
 * closure-scoped counter, no signal involved at all) owned by
 * `MatAutocomplete` itself, one per component instance. Its digits are
 * independent of the shared `mat-option-N`/`mat-select-N` sequence other
 * components mint from — harmless, since the parity harness squashes every
 * id's digits regardless (see `angular-parity.spec.ts`'s own header note:
 * "digits squashed by the harness regardless... within a single fresh page
 * load each scenario starts its own numbering") and only the `prefix-N`
 * SHAPE needs to match, never the actual number.
 */
import type {JSXOutput} from '@builder.io/qwik';

/** An id-minting counter — see the module doc comment for why this is a
 *  plain, non-reactive object, never the shared context-provided one. */
export interface AutocompleteIdGenerator {
  getId(prefix: string): string;
}

/** One `<mat-option>`. Mirrors `MatOption`'s inputs (`value`/`disabled`/`id`) +
 *  its rendered text content (`label`), or richer content via `content`. */
export interface MatAutocompleteOptionDef<T = unknown> {
  value?: T;
  /** Plain-text label — used for the option's own rendered text when
   *  `content` is omitted, AND as the fallback identity key (see
   *  `entryKey()`) for an object-valued option whose `value` can't be
   *  turned into a useful string (e.g. `displayWith`'s `{name: 'Mary'}`). */
  label: string;
  /** Optional richer body for the option. Defaults to rendering `label` as
   *  plain text when omitted. */
  content?: JSXOutput;
  disabled?: boolean;
  /** Explicit id. Stable across refilters automatically when omitted — see
   *  the module doc comment's `idCache`. */
  id?: string;
  /** Explicit identity key for the `idCache`/id-stability lookup, when
   *  `value`'s own `String(...)` form wouldn't be a useful/unique key (an
   *  object value). Defaults to `String(value)`, then `label`. */
  key?: string;
  /** Whether `value` should be echoed as a literal `value` DOM attribute
   *  on the rendered `<mat-option>` — see `core/mat-option.tsx`'s
   *  `echoValue` doc comment for the full "why this varies per scenario"
   *  write-up. Defaults `false` (most of this port's scenarios bind
   *  `[value]`, never reflected as an attribute by Angular); the one
   *  scenario using a static, bracket-less binding (`disabled-option`)
   *  passes `true` explicitly, per option. */
  echoValueAttr?: boolean;
}

/** One `<mat-optgroup>`, wrapping its own options. */
export interface MatAutocompleteGroupDef {
  label: string;
  disabled?: boolean;
  /** Explicit label id — see `MatAutocompleteOptionDef.id`'s doc comment. */
  id?: string;
  /** Explicit identity key — see `MatAutocompleteOptionDef.key`'s doc comment.
   *  Defaults to `label`. */
  key?: string;
  options: readonly MatAutocompleteOptionDef[];
}

export type MatAutocompleteEntryDef = MatAutocompleteOptionDef | MatAutocompleteGroupDef;

function isGroupDef(entry: MatAutocompleteEntryDef): entry is MatAutocompleteGroupDef {
  return Array.isArray((entry as MatAutocompleteGroupDef).options);
}

/** One resolved `<MatOption>`, flattened in document order across every
 *  group — mirrors upstream's `options: QueryList<MatOption>`
 *  (`{descendants: true}`, i.e. flat regardless of `<mat-optgroup>` nesting). */
export interface ResolvedAutocompleteOption {
  /** Position in the FLAT list — what the key manager indexes by. */
  index: number;
  value: unknown;
  /** `ownDisabled || groupDisabled` — mirrors `MatOption.disabled`'s getter. */
  disabled: boolean;
  id: string;
  /** Plain-text label — mirrors `MatOption.viewValue`/`getLabel()`. */
  label: string;
  /** Content to render — `def.content` if given, else `def.label` as plain text. */
  content: JSXOutput;
  /** See `MatAutocompleteOptionDef.echoValueAttr`'s doc comment. */
  echoValueAttr: boolean;
}

export interface ResolvedAutocompleteGroup {
  label: string;
  disabled: boolean;
  id: string;
}

/** A node in render-order — either a bare option or a group wrapping its
 *  own options. */
export type ResolvedAutocompleteNode =
  | {kind: 'option'; option: ResolvedAutocompleteOption}
  | {kind: 'group'; group: ResolvedAutocompleteGroup; options: ResolvedAutocompleteOption[]};

export interface ResolvedAutocompleteOptions {
  /** Render-order tree — what `MatAutocompletePanel` maps over directly. */
  tree: ResolvedAutocompleteNode[];
  /** Same options, flattened — what the key manager / selection logic uses. */
  flat: ResolvedAutocompleteOption[];
}

/** Derives a stable identity key for an entry — see the module doc comment. */
function entryKey(entry: {id?: string; key?: string; value?: unknown; label: string}): string {
  if (entry.id) return `id:${entry.id}`;
  if (entry.key) return `key:${entry.key}`;
  const value = entry.value;
  if (value != null && (typeof value === 'string' || typeof value === 'number')) {
    return `value:${value}`;
  }
  return `label:${entry.label}`;
}

function resolveOption(
  def: MatAutocompleteOptionDef,
  index: number,
  groupDisabled: boolean,
  idCache: Map<string, string>,
  idGen: AutocompleteIdGenerator,
): ResolvedAutocompleteOption {
  const key = entryKey(def);
  let id = def.id ?? idCache.get(key);
  if (!id) {
    id = idGen.getId('mat-option-');
    idCache.set(key, id);
  }
  return {
    index,
    value: def.value,
    disabled: (def.disabled ?? false) || groupDisabled,
    id,
    label: def.label,
    content: def.content ?? def.label,
    echoValueAttr: def.echoValueAttr ?? false,
  };
}

/**
 * Walks `options` (document order), flattening every option — direct or
 * nested inside a group — into {@link ResolvedAutocompleteOptions}.
 * Intended to be called FRESH on every render — see the module doc comment
 * for why this is cheap and id-stable despite that.
 */
export function resolveAutocompleteOptions(
  options: ReadonlyArray<MatAutocompleteEntryDef> | undefined,
  idCache: Map<string, string>,
  idGen: AutocompleteIdGenerator,
): ResolvedAutocompleteOptions {
  const tree: ResolvedAutocompleteNode[] = [];
  const flat: ResolvedAutocompleteOption[] = [];

  for (const entry of options ?? []) {
    if (isGroupDef(entry)) {
      const groupDisabled = entry.disabled ?? false;
      const groupKey = entryKey(entry);
      let groupId = entry.id ?? idCache.get(groupKey);
      if (!groupId) {
        groupId = idGen.getId('mat-optgroup-label-');
        idCache.set(groupKey, groupId);
      }
      const group: ResolvedAutocompleteGroup = {
        label: entry.label,
        disabled: groupDisabled,
        id: groupId,
      };

      const groupOptions: ResolvedAutocompleteOption[] = [];
      for (const optionDef of entry.options) {
        const option = resolveOption(optionDef, flat.length, groupDisabled, idCache, idGen);
        flat.push(option);
        groupOptions.push(option);
      }
      tree.push({kind: 'group', group, options: groupOptions});
    } else {
      const option = resolveOption(entry, flat.length, false, idCache, idGen);
      flat.push(option);
      tree.push({kind: 'option', option});
    }
  }

  return {tree, flat};
}
