import {describe, it, expect} from 'vitest';
import {withIconSvgAttributes} from './icon-svg-attrs';

describe('withIconSvgAttributes', () => {
  it('appends fit/height/width/preserveAspectRatio/focusable to a bare <svg> tag', () => {
    const input = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 1"/></svg>`;
    const output = withIconSvgAttributes(input);
    expect(output).toContain('viewBox="0 0 24 24"');
    expect(output).toContain('aria-hidden="true"');
    expect(output).toContain('fit=""');
    expect(output).toContain('height="100%"');
    expect(output).toContain('width="100%"');
    expect(output).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(output).toContain('focusable="false"');
    expect(output).toContain('<path d="M1 1"/></svg>');
  });

  it('overwrites a pre-existing occurrence of one of the five attributes', () => {
    const input = `<svg height="24" width="24"></svg>`;
    const output = withIconSvgAttributes(input);
    // Old values gone, new ones present exactly once.
    expect(output).not.toContain('height="24"');
    expect(output).not.toContain('width="24"');
    expect((output.match(/height="/g) ?? []).length).toBe(1);
    expect((output.match(/width="/g) ?? []).length).toBe(1);
    expect(output).toContain('height="100%"');
    expect(output).toContain('width="100%"');
  });

  it('only touches the root <svg> tag, leaving nested elements alone', () => {
    const input = `<svg viewBox="0 0 1 1"><rect width="1" height="1"/></svg>`;
    const output = withIconSvgAttributes(input);
    expect(output).toContain('<rect width="1" height="1"/>');
  });
});
