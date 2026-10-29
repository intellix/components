/**
 * Resolves `MatSelect`'s `options` prop into the flat, synchronous data
 * `MatSelect` needs for everything upstream derives from its
 * `@ContentChildren(MatOption, {descendants: true})` QueryList: keyboard
 * navigation, selection, id assignment, `triggerValue`, and the
 * `<MatOptgroup>`/`<MatOption>` tree it renders inside `MatSelectPanel`.
 *
 * ## Why `options` is a PLAIN-DATA array, not `<MatOption>` JSX elements
 *
 * An earlier version of this port took `options: JSXOutput[]` — an array
 * of `<MatOption>`/`<MatOptgroup>` *descriptors*, mined via `.props`
 * without ever rendering them (the same "read `.props` without rendering"
 * technique `core/mat-form-field-control.ts`'s `readControlProps` and
 * `qwik-material/grid-list/jsx-children.ts`'s `collectTypedChildren`
 * already use elsewhere in this project). That turned out to be broken for
 * a reason neither of those precedents hits: `MatSelect` needs the
 * resolved option data again INSIDE its own lazily-resolved `$()` event
 * handlers (`onTriggerClick$`/`onHostKeyDown$`), not just once during its
 * initial render. Confirmed live, with a reproducible, isolated repro (not
 * a guess): a JSX descriptor's `.type` field is a reference to a
 * `component$()`-wrapped function (`MatOption`) — safe for Qwik to
 * serialize when the descriptor is an ACTUAL VNODE Qwik itself is
 * rendering/diffing, but NOT when it's sitting inertly inside plain prop
 * data that a *different* component (`MatSelect`) merely introspects.
 * Reading `props.options` (or any signal memoizing a value derived from
 * it) from inside a `$()` handler resumed after the SSR→client boundary
 * consistently deserialized to empty/undefined — even for a scenario
 * (`preselected-value`) whose INITIAL render demonstrably used
 * `props.options` correctly (the trigger showed "Banana" from the first
 * paint). Plain data with no embedded component-function references
 * (exactly `qwik-material/tabs`' `MatTabGroup.tabs: MatTabDef[]` shape —
 * already proven to survive this exact path, including its own `$()`
 * handlers) does not have this problem. See select/SYNC.md for the full
 * write-up.
 *
 * So `options` is an array of {@link MatSelectOptionDef}/
 * {@link MatSelectGroupDef} — plain objects. `content` (an ESCAPE HATCH
 * for an option's richer-than-plain-text body, e.g. a leading icon) is the
 * one field that may legitimately hold a `JSXOutput` — safe because it is
 * only ever FORWARDED opaquely for rendering (passed straight through to
 * `<MatOption>{entry.content}</MatOption>` inside `MatSelectPanel`, a
 * normal render path, never read back out inside a `$()` handler), exactly
 * matching `MatTabDef.content`/`.labelTemplate`'s already-proven-safe
 * usage — never introspected the way the old `options: JSXOutput[]` shape
 * was.
 */
import type {JSXOutput} from '@builder.io/qwik';

/** One `<mat-option>`. Mirrors `MatOption`'s inputs (`value`/`disabled`/`id`) +
 *  its rendered text content (`label`), or richer content via `content`. */
export interface MatSelectOptionDef<T = unknown> {
  value?: T;
  /** Plain-text label — used for `viewValue` (typeahead matching, the
   *  trigger's joined text). Always provided, even when `content` is set
   *  (mirrors upstream's `MatOption.viewValue`, read off the rendered
   *  text regardless of how rich the projected content is). */
  label: string;
  /** Optional richer body for the option — e.g. with a leading icon.
   *  Defaults to rendering `label` as plain text when omitted. Never
   *  introspected by `MatSelect` — see the module doc comment. */
  content?: JSXOutput;
  disabled?: boolean;
  /** Explicit id. Auto-generated (`mat-option-N`) when omitted. */
  id?: string;
  /** Mirrors `MatOptionProps.echoValueAttr` — default `true`. Set `false` when the real
   *  upstream template binds this option's value as a genuine property binding (`[value]="..."`,
   *  never echoed as a DOM attribute) rather than a static one — see that prop's own doc comment
   *  and `qwik-material/paginator/SYNC.md`. */
  echoValueAttr?: boolean;
}

/** One `<mat-optgroup>`, wrapping its own options. */
export interface MatSelectGroupDef {
  label: string;
  disabled?: boolean;
  /** Explicit label id. Auto-generated (`mat-optgroup-label-N`) when omitted. */
  id?: string;
  options: readonly MatSelectOptionDef[];
}

export type MatSelectEntryDef = MatSelectOptionDef | MatSelectGroupDef;

function isGroupDef(entry: MatSelectEntryDef): entry is MatSelectGroupDef {
  return Array.isArray((entry as MatSelectGroupDef).options);
}

/** One resolved `<MatOption>`, flattened — order matches document order
 *  across every group, mirroring upstream's `options: QueryList<MatOption>`
 *  (`{descendants: true}`, i.e. flat regardless of `<mat-optgroup>` nesting). */
export interface ResolvedSelectOption {
  /** Position in the FLAT list — what the key manager and `mat-option-N`
   *  ids are indexed by. */
  index: number;
  value: unknown;
  /** This option's own `disabled`, WITHOUT the owning group's. */
  ownDisabled: boolean;
  /** `ownDisabled || groupDisabled` — mirrors `MatOption.disabled`'s getter. */
  disabled: boolean;
  id: string;
  /** Plain-text label — mirrors `MatOption.viewValue`/`getLabel()`. */
  label: string;
  /** Content to render — `def.content` if given, else `def.label` as plain text. */
  content: JSXOutput;
  /** Index into {@link ResolvedSelectOptions.groups}, if inside a group. */
  groupIndex: number | undefined;
  /** See {@link MatSelectOptionDef.echoValueAttr}. */
  echoValueAttr: boolean;
}

export interface ResolvedSelectGroup {
  index: number;
  label: string;
  disabled: boolean;
  id: string;
}

/** A node in the render-order tree — either a bare option or a group
 *  wrapping its own options (always flattened per {@link ResolvedSelectOption}
 *  too, for keyboard/selection logic that doesn't care about grouping). */
export type ResolvedSelectNode =
  | {kind: 'option'; option: ResolvedSelectOption}
  | {kind: 'group'; group: ResolvedSelectGroup; options: ResolvedSelectOption[]};

export interface ResolvedSelectOptions {
  /** Render-order tree — what `MatSelect` maps over directly. */
  tree: ResolvedSelectNode[];
  /** Same options, flattened — what the key manager / selection logic uses. */
  flat: ResolvedSelectOption[];
  groups: ResolvedSelectGroup[];
}

export interface SelectOptionIdGenerator {
  getId(prefix: string): string;
}

function resolveOption(
  def: MatSelectOptionDef,
  index: number,
  groupIndex: number | undefined,
  groupDisabled: boolean,
  idGen: SelectOptionIdGenerator,
): ResolvedSelectOption {
  const ownDisabled = def.disabled ?? false;
  return {
    index,
    value: def.value,
    ownDisabled,
    disabled: ownDisabled || groupDisabled,
    id: def.id ?? idGen.getId('mat-option-'),
    label: def.label,
    content: def.content ?? def.label,
    groupIndex,
    echoValueAttr: def.echoValueAttr ?? true,
  };
}

/**
 * Walks `options` (document order), flattening every option — direct or
 * nested inside a group — into {@link ResolvedSelectOptions}.
 */
export function resolveSelectOptions(
  options: ReadonlyArray<MatSelectEntryDef> | undefined,
  idGen: SelectOptionIdGenerator,
): ResolvedSelectOptions {
  const tree: ResolvedSelectNode[] = [];
  const flat: ResolvedSelectOption[] = [];
  const groups: ResolvedSelectGroup[] = [];

  for (const entry of options ?? []) {
    if (isGroupDef(entry)) {
      const groupDisabled = entry.disabled ?? false;
      const group: ResolvedSelectGroup = {
        index: groups.length,
        label: entry.label,
        disabled: groupDisabled,
        id: entry.id ?? idGen.getId('mat-optgroup-label-'),
      };
      groups.push(group);

      const groupOptions: ResolvedSelectOption[] = [];
      for (const optionDef of entry.options) {
        const option = resolveOption(optionDef, flat.length, group.index, groupDisabled, idGen);
        flat.push(option);
        groupOptions.push(option);
      }
      tree.push({kind: 'group', group, options: groupOptions});
    } else {
      const option = resolveOption(entry, flat.length, undefined, false, idGen);
      flat.push(option);
      tree.push({kind: 'option', option});
    }
  }

  return {tree, flat, groups};
}
