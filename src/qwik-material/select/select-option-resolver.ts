/**
 * Resolves `MatSelect`'s `options` prop — an array of `<MatOption>`/
 * `<MatOptgroup>` JSX *descriptors* (never rendered directly; see
 * `mat-optgroup.tsx`'s doc comment and `select/SYNC.md`'s "SSR-correct
 * option-definition shape" write-up) — into the flat, synchronous data
 * `MatSelect` needs for everything upstream derives from its
 * `@ContentChildren(MatOption, {descendants: true})` QueryList: keyboard
 * navigation, selection, id assignment, `triggerValue`, and finally the
 * fresh `<MatOptgroup>`/`<MatOption>` elements it renders itself.
 *
 * `<MatOption>{text}</MatOption>`'s `text` is read directly off the
 * descriptor's `props.children` (a plain string/number/array at the point
 * the CALLER constructed the JSX — never executed/rendered) via
 * {@link extractOptionText} — the same "read `.props` without rendering"
 * technique `core/mat-form-field-control.ts`'s `readControlProps` and
 * `qwik-material/grid-list/jsx-children.ts`'s `collectTypedChildren`
 * already established, specialized here for text content instead of
 * structural presence/props.
 */
import type {JSXChildren, JSXNode, JSXOutput} from '@builder.io/qwik';
import {MatOption} from '../core/mat-option';
import {MatOptgroup} from '../core/mat-optgroup';

function isJsxNode(value: unknown): value is JSXNode {
  return typeof value === 'object' && value !== null && 'type' in (value as object);
}

/** Depth-first extraction of a JSX children tree's plain text content —
 *  enough for every scenario's plain-text `<MatOption>`/`<MatOptgroup>`
 *  content (mirrors upstream `MatOption.viewValue`'s `textContent.trim()`,
 *  computed here from the JSX descriptor instead of a live DOM node since
 *  none exists yet). Richer per-option markup (e.g. a nested `<mat-icon>`)
 *  is out of scope — see SYNC.md's deviations list. */
export function extractOptionText(children: JSXChildren | undefined | null): string {
  if (children == null || typeof children === 'boolean') return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractOptionText).join('');
  if (isJsxNode(children)) {
    const props = children.props as {children?: JSXChildren} | undefined;
    if (props && 'children' in props) return extractOptionText(props.children);
    if (children.children != null) return extractOptionText(children.children as JSXChildren);
    return '';
  }
  return '';
}

interface RawOptionProps {
  value?: unknown;
  id?: string;
  disabled?: boolean;
  children?: JSXChildren;
}

interface RawOptgroupProps {
  label?: string;
  disabled?: boolean;
  id?: string;
  children?: JSXChildren;
}

function isMatOptionNode(node: unknown): node is JSXNode<typeof MatOption> {
  return isJsxNode(node) && node.type === MatOption;
}

function isMatOptgroupNode(node: unknown): node is JSXNode<typeof MatOptgroup> {
  return isJsxNode(node) && node.type === MatOptgroup;
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
  /** Original JSX children, re-rendered as this option's own content. */
  content: JSXChildren | undefined;
  /** Index into {@link ResolvedSelectOptions.groups}, if inside a `<MatOptgroup>`. */
  groupIndex: number | undefined;
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
  node: JSXNode<typeof MatOption>,
  index: number,
  groupIndex: number | undefined,
  groupDisabled: boolean,
  idGen: SelectOptionIdGenerator,
): ResolvedSelectOption {
  const props = node.props as RawOptionProps;
  const ownDisabled = props.disabled ?? false;
  return {
    index,
    value: props.value,
    ownDisabled,
    disabled: ownDisabled || groupDisabled,
    id: props.id ?? idGen.getId('mat-option-'),
    label: extractOptionText(props.children).trim(),
    content: props.children,
    groupIndex,
  };
}

/**
 * Walks `options` (document order), flattening every `<MatOption>` — direct
 * or nested inside a `<MatOptgroup>` — into {@link ResolvedSelectOptions}.
 * Non-matching entries (`null`/`undefined`/`false`, stray strings) are
 * skipped silently, mirroring `@ContentChildren` simply not matching them.
 */
export function resolveSelectOptions(
  options: ReadonlyArray<JSXOutput> | undefined,
  idGen: SelectOptionIdGenerator,
): ResolvedSelectOptions {
  const tree: ResolvedSelectNode[] = [];
  const flat: ResolvedSelectOption[] = [];
  const groups: ResolvedSelectGroup[] = [];

  for (const node of options ?? []) {
    if (isMatOptionNode(node)) {
      const option = resolveOption(node, flat.length, undefined, false, idGen);
      flat.push(option);
      tree.push({kind: 'option', option});
    } else if (isMatOptgroupNode(node)) {
      const groupProps = node.props as RawOptgroupProps;
      const groupDisabled = groupProps.disabled ?? false;
      const group: ResolvedSelectGroup = {
        index: groups.length,
        label: groupProps.label ?? '',
        disabled: groupDisabled,
        id: groupProps.id ?? idGen.getId('mat-optgroup-label-'),
      };
      groups.push(group);

      const childNodes = Array.isArray(groupProps.children)
        ? groupProps.children
        : groupProps.children != null
          ? [groupProps.children]
          : [];
      const groupOptions: ResolvedSelectOption[] = [];
      for (const child of childNodes) {
        if (isMatOptionNode(child)) {
          const option = resolveOption(child, flat.length, group.index, groupDisabled, idGen);
          flat.push(option);
          groupOptions.push(option);
        }
      }
      tree.push({kind: 'group', group, options: groupOptions});
    }
    // Anything else (a stray string/boolean/etc.) is silently skipped,
    // mirroring @ContentChildren(MatOption) simply never matching it.
  }

  return {tree, flat, groups};
}
