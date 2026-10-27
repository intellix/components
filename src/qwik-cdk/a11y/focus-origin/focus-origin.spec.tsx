// @vitest-environment node
import {describe, it, expect} from 'vitest';
import {createDOM} from '@builder.io/qwik/testing';
import {component$} from '@builder.io/qwik';
import {useFocusOrigin} from './focus-origin';

const Host = component$(() => {
  const origin = useFocusOrigin();
  return <div data-testid="host">{origin.value ?? 'none'}</div>;
});

describe('useFocusOrigin', () => {
  it('renders with a null origin before any interaction (lazy — no useVisibleTask$ needed)', async () => {
    const {render, screen} = await createDOM();
    await render(<Host />);
    expect(screen.outerHTML).toContain('none');
  });

  it('is callable from a component$ without throwing (useOn registration succeeds)', async () => {
    const {render, screen} = await createDOM();
    await render(<Host />);
    expect(screen.querySelector('[data-testid="host"]')).toBeTruthy();
  });
});
