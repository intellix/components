import {$, component$, useContext} from '@qwik.dev/core';
import {CDK_TREE_TOGGLE_STATE, type CdkTreeNodeInput} from '@angular-community/qwik-cdk/tree';
import {MatIconButton} from '@angular-community/qwik-material/button';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatIcon} from '@angular-community/qwik-material/icon';
import {MatTree} from '@angular-community/qwik-material/tree';
import './tree-nested-child-accessor-overview-example.css';

// Qwik port of material.angular.dev's `tree-nested-child-accessor-overview` docs example — see
// src/components-examples/material/tree/tree-nested-child-accessor-overview/
// tree-nested-child-accessor-overview-example.{ts,html}. Rendered unmodified by the Angular
// dev-app at /qwik-parity/examples/tree-nested-child-accessor-overview
// (src/dev-app/qwik-parity/examples.ts' generic `examples/:exampleId` route). Host tag mirrors
// the example's own component selector (`tree-nested-child-accessor-overview-example`). Same
// `FOOD_DATA`/toggle-button composition as the already-ported `tree-flat-child-accessor-overview`
// (`qwik-material-examples/tree/example`) — see that file's own header comment for why
// `TreeNodeToggleButton` composes `<MatIconButton>` directly against the tree's own
// `CDK_TREE_TOGGLE_STATE` context instead of going through `<MatTreeNodeToggle>` (which renders a
// bare, unstyled toggle element by design, not an icon-button). Duplicated here rather than
// shared, matching upstream's OWN two example files, which duplicate this data/logic verbatim
// rather than sharing a module.
//
// Unlike the flat example's leaf template (which pads itself with a disabled `<button
// matIconButton>` placeholder so the label aligns with expandable rows), the REAL upstream nested
// leaf template (`tree-nested-child-accessor-overview-example.html`) has no such button — nested
// trees get their indentation from CSS (`.mat-nested-tree-node div[role=group]`'s `padding-left`,
// in this example's own `.css`), not a spacer element. `qwik-material/tree`'s `tree-prebuilt.scss`
// doesn't ship that particular `.example-tree`-scoped padding (it's example-specific styling, not
// part of the component itself) — out of scope for DOM-parity purposes (`angular-parity.spec.ts`
// only compares the actual element tree/attributes, not page layout/visual padding).
//
// The real upstream template also toggles the group wrapper's visibility via a STYLESHEET CLASS
// (`[class.example-tree-invisible]="!tree.isExpanded(node)"`, defined in this example's own
// `.css`) rather than an inline `[style.display]` binding — unlike every OTHER mat-tree parity
// scenario in this port (`src/dev-app/qwik-parity/tree.ts`'s own nested mirrors, which deliberately
// use the style-binding form instead). `<MatTree>`'s `nestedHiddenClass` prop (added for this
// example) switches it to the class-toggle form — see that prop's own doc comment.
interface FoodNode {
  name: string;
  children?: FoodNode[];
}

const FOOD_DATA: FoodNode[] = [
  {
    name: 'Fruit',
    children: [{name: 'Apple'}, {name: 'Banana'}, {name: 'Fruit loops'}],
  },
  {
    name: 'Vegetables',
    children: [
      {
        name: 'Green',
        children: [{name: 'Broccoli'}, {name: 'Brussels sprouts'}],
      },
      {
        name: 'Orange',
        children: [{name: 'Pumpkins'}, {name: 'Carrots'}],
      },
    ],
  },
];

/** `<button matIconButton matTreeNodeToggle [attr.aria-label]="'Toggle ' + node.name">` — see the
 *  file header for why this composes `<MatIconButton>` with the tree's own toggle state directly,
 *  rather than going through `<MatTreeNodeToggle>`. */
const TreeNodeToggleButton = component$<{node: string; label: string}>(props => {
  const state = useContext(CDK_TREE_TOGGLE_STATE);
  const expanded = !!state.expanded[props.node];
  const key = props.node;

  return (
    <MatIconButton
      ariaLabel={`Toggle ${props.label}`}
      onClick$={$(() => {
        const next = !state.expanded[key];
        state.expanded[key] = next;
        state.activeKey.value = key;
        if (state.onExpandedChange) {
          void state.onExpandedChange(key, next, state.dataByKey.get(key));
        }
      })}
    >
      <MatIcon class="mat-icon-rtl-mirror">
        {expanded ? ' expand_more ' : ' chevron_right '}
      </MatIcon>
    </MatIconButton>
  );
});

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildNodes(data: FoodNode[]): CdkTreeNodeInput<FoodNode>[] {
  return data.map(node => {
    const key = slug(node.name);
    const hasChild = !!node.children && node.children.length > 0;
    if (!hasChild) {
      return {key, data: node, content: node.name};
    }
    return {
      key,
      data: node,
      // NOT `isExpandable: true` — upstream's own template
      // (`tree-nested-child-accessor-overview-example.html`) never binds `[isExpandable]` either
      // (same finding as the flat example — Angular's real `_isExpandable()` falls back to the
      // unbound `[isExpandable]` input, `false`, for a `childrenAccessor` tree regardless of
      // variant, so the real `<mat-nested-tree-node>` here carries NO `aria-expanded` attribute).
      // `MatTree`'s nested rendering decides whether to render the children/outlet wrapper from
      // whether this node actually HAS children, independently of this flag — see
      // `mat-tree.tsx`'s `renderNestedNode` comment and `qwik-material/tree/SYNC.md`.
      // `nodeToggle` is set explicitly (it would otherwise default to `isExpandable`'s value,
      // i.e. `false`) to keep keyboard Enter/Space on the ROW itself toggling — matching
      // upstream's `matTreeNodeToggle` written on the `<mat-nested-tree-node>` tag itself, not
      // just its inner button.
      nodeToggle: true,
      content: (
        <>
          <TreeNodeToggleButton node={key} label={node.name} />
          {` ${node.name} `}
        </>
      ),
      children: buildNodes(node.children!),
    };
  });
}

export default component$(() => {
  return (
    <tree-nested-child-accessor-overview-example>
      <QwikMaterialProvider matIconConfig={{fontSet: 'material-symbols-outlined'}}>
        <MatTree
          variant="nested"
          nodes={buildNodes(FOOD_DATA)}
          class="example-tree"
          nestedHiddenClass="example-tree-invisible"
        />
      </QwikMaterialProvider>
    </tree-nested-child-accessor-overview-example>
  );
});
