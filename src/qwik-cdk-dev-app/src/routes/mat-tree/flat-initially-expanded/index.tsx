import {component$} from '@qwik.dev/core';
import {CdkTreeNodeToggle, type CdkTreeNodeInput} from '@angular-community/qwik-cdk/tree';
import {MatTree} from '@angular-community/qwik-material/tree';

// Mirrors src/dev-app/qwik-parity/tree.ts's `TreeFlatInitiallyExpanded`.
interface FoodNode {
  name: string;
  children?: FoodNode[];
  expanded?: boolean;
}

function foodData(): FoodNode[] {
  const data: FoodNode[] = [
    {name: 'Fruit', children: [{name: 'Apple'}, {name: 'Banana'}]},
    {
      name: 'Vegetables',
      children: [
        {name: 'Leafy greens', children: [{name: 'Spinach'}, {name: 'Kale'}]},
        {name: 'Carrot'},
      ],
    },
  ];
  data[0].expanded = true; // Fruit starts expanded.
  return data;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildNodes(data: FoodNode[]): CdkTreeNodeInput<FoodNode>[] {
  return data.map(node => {
    const key = slug(node.name);
    if (!node.children?.length) {
      return {
        key,
        data: node,
        content: (
          <>
            {/* Qwik v2 bug (confirmed, not fixable in this port — see
                qwik-material/tree/SYNC.md): a STATIC/literal boolean attribute
                (`disabled`, bare or `={true}`) on an element created fresh on
                the client serializes as the literal string `disabled="true"`
                instead of the correct bare `disabled=""` form. A dynamic
                (not constant-foldable) value sidesteps it. */}
            <button type="button" disabled={!node.children?.length}></button>
            {node.name}
          </>
        ),
      };
    }
    return {
      key,
      data: node,
      isExpandable: true,
      isExpanded: !!node.expanded,
      content: (
        <>
          <CdkTreeNodeToggle
            node={key}
            aria-label={`Toggle ${node.name}`}
            collapsedLabel="[+]"
            expandedLabel="[-]"
          />
          {node.name}
        </>
      ),
      children: buildNodes(node.children),
    };
  });
}

export default component$(() => (
  <>
    <div data-parity-root>
      <MatTree nodes={buildNodes(foodData())} />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
