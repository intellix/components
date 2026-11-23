import {component$, useSignal} from '@qwik.dev/core';
import {createDOM} from '@qwik.dev/core/testing';
import {describe, expect, it} from 'vitest';
import {useMatBadge} from './public-api';

/**
 * The badge `content` sheet has ONE `<style>` id wherever a badge registers it: the server places
 * it with the content element (`BadgeContentStyles`, its own component), so the browser must
 * register it the same way — through the host's hook it would take that hook's position, a
 * different id, and a resumed host re-rendering would append the same CSS twice.
 */
describe('useMatBadge content sheet', () => {
  it('registers through the content element, whatever hook position useMatBadge takes', async () => {
    const Host = component$(() => {
      const extra = useSignal(0); // useMatBadge isn't this component's first hook
      const badge = useMatBadge({content: '4'});
      return (
        <span {...badge.hostProps} data-extra={extra.value}>
          {badge.content}
        </span>
      );
    });
    const {render, screen} = await createDOM();
    await render(<Host />);
    const ids = Array.from(screen.ownerDocument.querySelectorAll('style[q\\:style]'))
      .filter(s => s.textContent?.includes('.mat-badge-content{'))
      .map(s => s.getAttribute('q:style'));
    // BadgeContentStyles' own hook: the base at 0, `content` at 1.
    expect(ids).toHaveLength(1);
    expect(ids[0]).toMatch(/-1$/);
  });
});
