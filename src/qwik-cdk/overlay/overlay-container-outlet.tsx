import {component$, useContext} from '@builder.io/qwik';
import {OVERLAY_REGISTRY} from './overlay-registry';
import {OverlayHost} from './overlay-host';

export const OverlayContainerOutlet = component$(() => {
  const registry = useContext(OVERLAY_REGISTRY);
  if (registry.entries.value.length === 0) return null;
  return (
    <div class="cdk-overlay-container">
      {registry.entries.value.map(e => (
        <OverlayHost entry={e} key={e.id} />
      ))}
    </div>
  );
});
