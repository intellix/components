import {component$, useContext} from '@builder.io/qwik';
import {OverlayHost} from './overlay-host';
import {QWIK_CDK} from '../internals/internals';

export const OverlayContainerOutlet = component$(() => {
  const ctx = useContext(QWIK_CDK);
  // Mirrors upstream `OverlayContainer.getContainerElement()`: the container
  // element doesn't exist at all until the first overlay is created; once
  // created, it's kept in the DOM (even empty) for the lifetime of the app —
  // it is never removed just because the last overlay detached.
  if (!ctx.overlayContainerCreated.value) return null;
  return (
    <div class="cdk-overlay-container">
      {ctx.entries.value.map(e => (
        <OverlayHost entry={e} key={e.id} />
      ))}
    </div>
  );
});
