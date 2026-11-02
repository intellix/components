// @vitest-environment node
import {describe, it, expect} from 'vitest';
import {createDOM} from '@qwik.dev/core/testing';
import {component$} from '@qwik.dev/core';
import {CdkPortalOutlet} from './public-api';

const Hello = component$<{name: string}>(({name}) => <span>Hello {name}</span>);

describe('CdkPortalOutlet', () => {
  it('renders the given portal', async () => {
    const {render, screen} = await createDOM();
    await render(<CdkPortalOutlet portal={{Component: Hello, props: {name: 'World'}}} />);
    expect(screen.outerHTML).toContain('Hello World');
  });
});
