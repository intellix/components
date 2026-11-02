import {component$, useStore} from '@qwik.dev/core';
import {CdkTreeNodeToggle, type CdkTreeNodeInput} from '@angular-community/qwik-cdk/tree';
import {MatTree, MatTreeNodeToggle} from '@angular-community/qwik-material/tree';

// Qwik-only: behaviour angular-parity.spec.ts doesn't exercise, because
// it's a Qwik-API-shape concern, not a DOM-parity one — Angular's
// `(expandedChange)`/`(activation)` outputs are an Angular TEMPLATE
// binding (`lastActivated = $event.name`), with no equivalent "assert
// the exact callback arguments" concept on the Angular side to mirror.
// Covers 3 things in one page (own `data-*` test hook per section, same
// convention as mat-table/qwik-only):
//
// 1. `.expanded-change-log` — `onExpandedChange$(key, expanded, data)`
//    fires with the correct arguments for BOTH toggle-click-driven and
//    keyboard-driven (ArrowRight/ArrowLeft/`*`) expansion changes, in
//    order, exactly once per actual state flip.
// 2. `.activation-log` — `onActivation$(data, key)` fires with the
//    correct arguments for a leaf's Enter/Space (reusing the same
//    mechanism `keyboard-nav`'s DOM-level "Last activated" text already
//    exercises, just asserting the RAW callback args here instead of
//    rendered text).
// 3. `.mat-tree-node-toggle-reexport` — `MatTreeNodeToggle` (qwik-material)
//    is really the SAME component as `CdkTreeNodeToggle` (qwik-cdk), not
//    a separate reimplementation that could drift — both toggle the SAME
//    node correctly when used side by side.

interface Node {
  name: string;
  children?: Node[];
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildNodes(data: Node[]): CdkTreeNodeInput<Node>[] {
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

const callbackData = (): Node[] => [{name: 'Root', children: [{name: 'ChildA'}, {name: 'ChildB'}]}];

export default component$(() => {
  const log = useStore<{expanded: string[]; activation: string[]}>({
    expanded: [],
    activation: [],
  });

  // Section 3: two independent small trees, one toggled via
  // `CdkTreeNodeToggle`, the other via the re-exported `MatTreeNodeToggle`
  // — both must drive the SAME expansion-state/tabindex mechanics.
  const cdkToggleNodes: CdkTreeNodeInput<Node>[] = [
    {
      key: 'cdk-root',
      data: {name: 'Root'},
      isExpandable: true,
      content: (
        <>
          <CdkTreeNodeToggle node="cdk-root" collapsedLabel="[+]" expandedLabel="[-]" />
          Root
        </>
      ),
      children: [{key: 'cdk-child', data: {name: 'Child'}, content: 'Child'}],
    },
  ];
  const matToggleNodes: CdkTreeNodeInput<Node>[] = [
    {
      key: 'mat-root',
      data: {name: 'Root'},
      isExpandable: true,
      content: (
        <>
          <MatTreeNodeToggle node="mat-root" collapsedLabel="[+]" expandedLabel="[-]" />
          Root
        </>
      ),
      children: [{key: 'mat-child', data: {name: 'Child'}, content: 'Child'}],
    },
  ];

  return (
    <>
      <div class="expanded-change-log-section">
        <MatTree
          nodes={buildNodes(callbackData())}
          onExpandedChange$={(key, expanded) => {
            log.expanded = [...log.expanded, `${key}:${expanded}`];
          }}
          onActivation$={data => {
            log.activation = [...log.activation, (data as Node).name];
          }}
        />
        <p class="expanded-change-log">{log.expanded.join(',') || '(none)'}</p>
        <p class="activation-log">{log.activation.join(',') || '(none)'}</p>
      </div>
      <div class="mat-tree-node-toggle-reexport">
        <MatTree variant="nested" nodes={cdkToggleNodes} class="cdk-toggle-tree" />
        <MatTree variant="nested" nodes={matToggleNodes} class="mat-toggle-tree" />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
