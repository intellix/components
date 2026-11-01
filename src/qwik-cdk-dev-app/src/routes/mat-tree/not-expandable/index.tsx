import {component$} from '@qwik.dev/core';
import {CdkTreeNodeToggle, type CdkTreeNodeInput} from '@angular-community/qwik-cdk/tree';
import {MatTree} from '@angular-community/qwik-material/tree';

// Mirrors src/dev-app/qwik-parity/tree.ts's `TreeNotExpandable`.
interface NotExpandableNode {
  name: string;
  children?: NotExpandableNode[];
  disabled?: boolean;
}

const data: NotExpandableNode[] = [
  {name: 'Leaf'},
  {name: 'Branch', children: [{name: 'Branch child'}]},
  {name: 'Disabled branch', disabled: true, children: [{name: 'Hidden child'}]},
];

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildNodes(nodes: NotExpandableNode[]): CdkTreeNodeInput<NotExpandableNode>[] {
  return nodes.map(node => {
    const key = slug(node.name);
    if (!node.children?.length) {
      return {key, data: node, content: node.name};
    }
    return {
      key,
      data: node,
      isExpandable: true,
      isDisabled: !!node.disabled,
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
      <MatTree nodes={buildNodes(data)} />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
