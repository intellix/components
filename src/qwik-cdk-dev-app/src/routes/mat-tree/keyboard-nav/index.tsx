import {component$, useSignal} from '@qwik.dev/core';
import {CdkTreeNodeToggle, type CdkTreeNodeInput} from '@angular-community/qwik-cdk/tree';
import {MatTree} from '@angular-community/qwik-material/tree';

// Mirrors src/dev-app/qwik-parity/tree.ts's `TreeKeyboardNav`.
interface FoodNode {
  name: string;
  children?: FoodNode[];
}

function foodData(): FoodNode[] {
  return [
    {name: 'Fruit', children: [{name: 'Apple'}, {name: 'Banana'}]},
    {
      name: 'Vegetables',
      children: [
        {name: 'Leafy greens', children: [{name: 'Spinach'}, {name: 'Kale'}]},
        {name: 'Carrot'},
      ],
    },
  ];
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
            <button type="button" disabled></button>
            {node.name}
          </>
        ),
      };
    }
    return {
      key,
      data: node,
      isExpandable: true,
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

export default component$(() => {
  const lastActivated = useSignal<string | undefined>(undefined);
  return (
    <>
      <div data-parity-root>
        <MatTree
          nodes={buildNodes(foodData())}
          onActivation$={data => {
            lastActivated.value = (data as FoodNode).name;
          }}
        />
        <p>Last activated: {lastActivated.value ?? '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
