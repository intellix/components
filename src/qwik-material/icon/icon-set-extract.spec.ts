import {describe, it, expect} from 'vitest';
import {extractIconFromSetMarkup} from './icon-set-extract';

describe('extractIconFromSetMarkup', () => {
  it('returns null when no element with that id exists', () => {
    const set = `<svg><symbol id="foo"><path d="M0 0"/></symbol></svg>`;
    expect(extractIconFromSetMarkup(set, 'missing')).toBeNull();
  });

  it('extracts a <symbol> as a standalone <svg>, carrying its attributes (sans id)', () => {
    const set = `<svg xmlns="http://www.w3.org/2000/svg"><symbol id="thumb-up" viewBox="0 0 24 24"><path d="M1 21h4"/></symbol></svg>`;
    const result = extractIconFromSetMarkup(set, 'thumb-up');
    expect(result).toBe('<svg viewBox="0 0 24 24"><path d="M1 21h4"/></svg>');
  });

  it('extracts a <symbol> with no other attributes (empty attribute list)', () => {
    const set = `<svg><symbol id="plain"><path d="M0 0"/></symbol></svg>`;
    const result = extractIconFromSetMarkup(set, 'plain');
    expect(result).toBe('<svg><path d="M0 0"/></svg>');
  });

  it('extracts an <svg id="..."> element as-is (sans id)', () => {
    const set = `<div><svg id="home" viewBox="0 0 10 10"><path d="M0 0"/></svg><svg id="other"><path d="M1 1"/></svg></div>`;
    const result = extractIconFromSetMarkup(set, 'home');
    expect(result).toBe('<svg viewBox="0 0 10 10"><path d="M0 0"/></svg>');
  });

  it('picks the correct one of two same-named siblings by id', () => {
    const set = `<svg><symbol id="a"><path d="A"/></symbol><symbol id="b"><path d="B"/></symbol></svg>`;
    expect(extractIconFromSetMarkup(set, 'a')).toBe('<svg><path d="A"/></svg>');
    expect(extractIconFromSetMarkup(set, 'b')).toBe('<svg><path d="B"/></svg>');
  });

  it('handles nested elements of a different tag name inside the matched symbol', () => {
    const set = `<svg><symbol id="nested" viewBox="0 0 24 24"><g><path d="M0 0"/><circle cx="1" cy="1" r="1"/></g></symbol></svg>`;
    const result = extractIconFromSetMarkup(set, 'nested');
    expect(result).toBe(
      '<svg viewBox="0 0 24 24"><g><path d="M0 0"/><circle cx="1" cy="1" r="1"/></g></svg>',
    );
  });

  it('wraps a bare non-svg/non-symbol element (e.g. a lone <path id>) in a fresh <svg>', () => {
    const set = `<svg><path id="lone" d="M0 0" fill="red"/></svg>`;
    const result = extractIconFromSetMarkup(set, 'lone');
    expect(result).toBe('<svg><path d="M0 0" fill="red"/></svg>');
  });

  it('exact id match only — does not match a longer id containing the name as a substring', () => {
    const set = `<svg><symbol id="home-outline"><path d="A"/></symbol><symbol id="home"><path d="B"/></symbol></svg>`;
    const result = extractIconFromSetMarkup(set, 'home');
    expect(result).toBe('<svg><path d="B"/></svg>');
  });

  it('supports single-quoted id attributes', () => {
    const set = `<svg><symbol id='single-quoted'><path d="A"/></symbol></svg>`;
    const result = extractIconFromSetMarkup(set, 'single-quoted');
    expect(result).toBe('<svg><path d="A"/></svg>');
  });
});
