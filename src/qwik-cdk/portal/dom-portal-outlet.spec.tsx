// @vitest-environment node
import {describe, it, expect} from 'vitest';
import {createDOM} from '@qwik.dev/core/testing';
import {CdkDomPortalOutlet} from './dom-portal-outlet';

describe('CdkDomPortalOutlet', () => {
  it('renders its slotted content in place when no target is resolved yet', async () => {
    const {render, screen} = await createDOM();
    await render(
      <CdkDomPortalOutlet target={undefined}>
        <span>Hello portal</span>
      </CdkDomPortalOutlet>,
    );
    expect(screen.outerHTML).toContain('Hello portal');
  });

  // Real DOM-relocation + context-propagation behavior needs `useVisibleTask$` to actually
  // run and move nodes between two real elements — `createDOM()`'s lightweight DOM shim
  // doesn't support that (the same "node.isAncestor is not a function" limitation already
  // documented for useFocusTrap-based components in `dialog/dialog-container.spec.tsx`'s own
  // comment). That coverage is a Playwright functional spec in the dev-app — see `SYNC.md`.
});
