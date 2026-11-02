import {$, component$, useContext} from '@qwik.dev/core';
import {CDK_TREE_TOGGLE_STATE, type CdkTreeNodeInput} from '@angular-community/qwik-cdk/tree';
import {MatIconButton} from '@angular-community/qwik-material/button';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatIcon} from '@angular-community/qwik-material/icon';
import {MatTree} from '@angular-community/qwik-material/tree';

// Qwik port of material.angular.dev's `tree-flat-child-accessor-overview` docs example — see
// src/components-examples/material/tree/tree-flat-child-accessor-overview/
// tree-flat-child-accessor-overview-example.{ts,html}. Rendered unmodified by the Angular dev-app
// at /qwik-parity/mat-tree/example (src/dev-app/qwik-parity/examples.ts). Host tag mirrors the
// example's own component selector (`tree-flat-child-accessor-overview-example`).
//
// Unlike every OTHER mat-tree parity scenario (which deliberately uses plain text `[+]`/`[-]`
// toggle buttons to stay decoupled from the button/icon components — see
// specs/material-tree/angular-parity.spec.ts's header), this example's own upstream template
// genuinely stacks `matIconButton` AND `matTreeNodeToggle` on the SAME `<button>`, with a real
// `<mat-icon>` child. `qwik-cdk/tree`'s own `<CdkTreeNodeToggle>` renders a bare button with no
// icon-button chrome (by design, see its own doc comment), and neither `<MatIconButton>` nor a
// toggle component can be nested inside the other (both host-render their own `<button>` root —
// nesting adds a wrapper element, failing DOM parity). `TreeNodeToggleButton` below composes the
// two at the CONSUMER level instead — reading the tree's own `CDK_TREE_TOGGLE_STATE` context
// directly (publicly exported from `@angular-community/qwik-cdk/tree`) the same way
// `CdkTreeNodeToggle` itself does — and renders it through the public `<MatIconButton>`, so no
// qwik-material/qwik-cdk change was needed for this example.
//
// `<MatIcon>` resolves ligature text via the registry-style default font-set class ladder
// (`MatIconConfig.fontSet`), not an explicit `fontSet` PROP (which would also render a
// `data-mat-icon-namespace` attribute upstream never sets for this un-bound `<mat-icon
// class="mat-icon-rtl-mirror">`). The Angular dev-app's OWN default is `material-symbols-outlined`
// (`DevAppLayout.toggleM3` → `MatIconRegistry.setDefaultFontSetClass(...)`, in effect since
// `m3Enabled` defaults to `true` — see `src/dev-app/dev-app/dev-app-layout.ts`), confirmed live
// against `/qwik-parity/mat-icon/basic`. `src/qwik-cdk-dev-app/src/routes/mat-icon/layout.tsx`
// already reproduces this for every `/mat-icon/*` scenario via a scoped `<QwikMaterialProvider
// matIconConfig={{fontSet: 'material-symbols-outlined'}}>` — this is the first OTHER route tree
// to render a font-mode `<MatIcon>`, so the same provider is applied here, inline, scoped to just
// this subtree (no wrapper DOM — `QwikMaterialProvider` renders a bare `<Slot/>`).
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
 *  rather than going through `<CdkTreeNodeToggle>`. */
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
      return {
        key,
        data: node,
        content: (
          <>
            <MatIconButton disabled />
            {` ${node.name} `}
          </>
        ),
      };
    }
    return {
      key,
      data: node,
      // NOT `isExpandable: true` — upstream's own template
      // (`tree-flat-child-accessor-overview-example.html`) never binds `[isExpandable]` at all
      // (confirmed live: Angular's real `<mat-tree-node>` here carries NO `aria-expanded`
      // attribute, even though the node genuinely has children and a working toggle — see
      // `qwik-cdk/tree/flatten-tree.ts`'s own doc comment: "must be set explicitly; never
      // inferred"). `nodeToggle` is set explicitly instead (it would otherwise default to
      // `isExpandable`'s value, i.e. `false`) to keep keyboard Enter/Space on the ROW itself
      // toggling — matching upstream's `matTreeNodeToggle` written on the `<mat-tree-node>` tag,
      // not just its inner button.
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
    <tree-flat-child-accessor-overview-example>
      <QwikMaterialProvider matIconConfig={{fontSet: 'material-symbols-outlined'}}>
        <MatTree nodes={buildNodes(FOOD_DATA)} />
      </QwikMaterialProvider>
    </tree-flat-child-accessor-overview-example>
  );
});
