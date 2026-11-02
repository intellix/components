import MarkdownIt from 'markdown-it';
import {createHighlighter, type Highlighter} from 'shiki';

/**
 * Build-time (SSG) content pipeline: Markdown -> HTML, with Shiki syntax highlighting for fenced
 * code blocks, and upstream's `<!-- example(id) -->` marker (`src/material/<c>/<c>.md`'s own
 * syntax) split out as separate segments so the route can render a REAL, interactive
 * `<ExampleEmbed>` Qwik component at that point instead of static innerHTML (markdown ->
 * `dangerouslySetInnerHTML` can only ever produce static markup, never a resumable component).
 *
 * Shiki's `createHighlighter()` is async (loads its WASM grammars/themes once); the returned
 * highlighter's `codeToHtml()` is synchronous, so a single highlighter instance can be reused
 * across every `highlight` callback in one `MarkdownIt` render pass.
 */

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: ['tsx', 'ts', 'html', 'css', 'scss', 'bash', 'json', 'text'],
  });
  return highlighterPromise;
}

const LANG_ALIASES: Record<string, string> = {sh: 'bash', shell: 'bash', jsx: 'tsx', js: 'tsx'};

export interface MarkdownSegment {
  type: 'html';
  html: string;
}

export interface ExampleSegment {
  type: 'example';
  id: string;
}

export type ContentSegment = MarkdownSegment | ExampleSegment;

const EXAMPLE_MARKER = /<!--\s*example\(([\w-]+)\)\s*-->/g;

/** Renders one fenced code block to highlighted HTML, outside of the full-document pipeline —
 *  used directly by the "View code" source panel (`CodeBlock`), not just inline in prose. */
export async function highlightCode(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter();
  const resolved = LANG_ALIASES[lang] ?? lang;
  const loaded = highlighter.getLoadedLanguages();
  const safeLang = loaded.includes(resolved as never) ? resolved : 'text';
  return highlighter.codeToHtml(code, {
    lang: safeLang,
    themes: {light: 'github-light', dark: 'github-dark'},
    defaultColor: false,
  });
}

async function renderMarkdownChunk(markdown: string): Promise<string> {
  const highlighter = await getHighlighter();
  const md = new MarkdownIt({html: true, linkify: true, typographer: false});
  md.options.highlight = (code: string, lang: string) => {
    const resolved = LANG_ALIASES[lang] ?? lang;
    const loaded = highlighter.getLoadedLanguages();
    const safeLang = lang && loaded.includes(resolved as never) ? resolved : 'text';
    return highlighter.codeToHtml(code, {
      lang: safeLang,
      themes: {light: 'github-light', dark: 'github-dark'},
      defaultColor: false,
    });
  };
  return md.render(markdown);
}

/** Splits a guide/overview Markdown document on `<!-- example(id) -->` markers and renders each
 *  text chunk to HTML, returning an ordered list of segments a route can map over directly. */
export async function renderContent(markdown: string): Promise<ContentSegment[]> {
  const parts = markdown.split(EXAMPLE_MARKER);
  // String.split with a capturing global regex returns [text, captured, text, captured, ..., text].
  const segments: ContentSegment[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const chunk = parts[i];
      if (chunk.trim().length === 0) continue;
      segments.push({type: 'html', html: await renderMarkdownChunk(chunk)});
    } else {
      segments.push({type: 'example', id: parts[i]});
    }
  }
  return segments;
}
