// @vitest-environment node
import {describe, it, expect} from 'vitest';
import {createDOM} from '@builder.io/qwik/testing';
import {component$, useContextProvider, useSignal, $, noSerialize} from '@builder.io/qwik';
import {OVERLAY_REGISTRY, OverlayContainerOutlet} from './public-api';

const Stub = component$(() => <div class="stub-content">hello</div>);

const Harness = component$(() => {
  const entries = useSignal<any[]>([]);
  const registry = noSerialize({
    entries,
    push(e: any) {
      entries.value = [...entries.value, e];
    },
    remove(id: string) {
      entries.value = entries.value.filter((entry: any) => entry.id !== id);
    },
    get(id: string) {
      return entries.value.find((entry: any) => entry.id === id);
    },
  });
  useContextProvider(OVERLAY_REGISTRY, registry as any);
  registry!.push({
    id: 'a',
    Component: Stub,
    props: {},
    config: {hasBackdrop: false} as any,
    state: {
      panelClasses: {value: []} as any,
      backdropShowing: {value: false} as any,
      detached: {value: false} as any,
      width: {value: undefined} as any,
      height: {value: undefined} as any,
      minWidth: {value: undefined} as any,
      minHeight: {value: undefined} as any,
      maxWidth: {value: undefined} as any,
      maxHeight: {value: undefined} as any,
    },
    lifecycle: {onAttached$: $(() => {}), onDetached$: $(() => {})},
  });
  return <OverlayContainerOutlet />;
});

describe('OverlayContainerOutlet', () => {
  it('renders cdk-overlay-container with one pane when registry has an entry', async () => {
    const {render, screen} = await createDOM();
    await render(<Harness />);
    expect(screen.outerHTML).toContain('cdk-overlay-container');
    expect(screen.outerHTML).toContain('cdk-overlay-pane');
    expect(screen.outerHTML).toContain('stub-content');
  });
});
