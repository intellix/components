import {describe, it, expect} from 'vitest';
import {createDOM} from '@qwik.dev/core/testing';
import {MatToolbar} from './mat-toolbar';

describe('MatToolbar (module-import smoke)', () => {
  it('MatToolbar is a Qwik component', () => {
    expect(MatToolbar).toBeDefined();
    expect(typeof MatToolbar).toBe('function');
  });
});

// Task 1 (homepage-material-parity): style passthrough so an app can bind inline `style` on
// `<mat-toolbar>`, matching what Angular already allows.
describe('MatToolbar — style passthrough (Task 1)', () => {
  it('passes style through to the host', async () => {
    const {render, screen} = await createDOM();
    await render(<MatToolbar style={{'padding-top': '64px'}}>content</MatToolbar>);
    const el = screen.querySelector('mat-toolbar') as HTMLElement;
    expect(el.style.getPropertyValue('padding-top')).toBe('64px');
  });
});
