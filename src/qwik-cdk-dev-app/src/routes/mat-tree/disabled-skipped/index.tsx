import {component$} from '@builder.io/qwik';
import type {CdkTreeNodeInput} from '@angular-community/qwik-cdk/tree';
import {MatTree} from '@angular-community/qwik-material/tree';

// Mirrors src/dev-app/qwik-parity/tree.ts's `TreeDisabledSkipped`.
interface DisabledSkippedNode {
  name: string;
  disabled?: boolean;
}

const data: DisabledSkippedNode[] = [
  {name: 'Alpha'},
  {name: 'Beta', disabled: true},
  {name: 'Gamma'},
];

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildNodes(nodes: DisabledSkippedNode[]): CdkTreeNodeInput<DisabledSkippedNode>[] {
  return nodes.map(node => ({
    key: slug(node.name),
    data: node,
    isDisabled: !!node.disabled,
    content: node.name,
  }));
}

export default component$(() => (
  <>
    <div data-parity-root>
      <MatTree nodes={buildNodes(data)} padding={false} />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
