import {component$, useContext} from '@builder.io/qwik';
import {OverlayHost} from './overlay-host';
import {QWIK_CDK} from '../internals/internals';

export const OverlayContainerOutlet = component$(() => {
  const ctx = useContext(QWIK_CDK);
  if (ctx.entries.value.length === 0) return null;
  return (
    <div class="cdk-overlay-container">
      {ctx.entries.value.map(e => (
        <OverlayHost entry={e} key={e.id} />
      ))}
    </div>
  );
});
