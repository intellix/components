import type {JSXOutput} from '@qwik.dev/core';

const INLINE_TOKEN = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Minimal inline Markdown -> JSX: backtick code spans (`` `MatButton` ``) and `[text](url)`
 * links. Used for short, dynamically-generated strings — JSDoc summaries/details in the API tab
 * (`components/api-reference.tsx`) and page subtitles (`data/components.ts`/`data/cdk.ts`'s own
 * `summary` fields, which routinely reference other API names in backticks) — that need basic
 * inline formatting but don't warrant the full build-time Markdown pipeline (`lib/markdown.ts`,
 * which needs Shiki + runs async) built for prose documents. Anything else (bold, italic, nested
 * structure) passes through as plain text; this is intentionally not a general Markdown parser.
 */
export function renderInlineMarkdown(text: string | undefined): JSXOutput {
  if (!text) return '';
  const parts: JSXOutput[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE_TOKEN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));
    if (match[1] !== undefined) {
      parts.push(<code key={key++}>{match[1]}</code>);
    } else {
      const href = match[3];
      const external = /^https?:\/\//.test(href);
      parts.push(
        <a key={key++} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener' : undefined}>
          {match[2]}
        </a>,
      );
    }
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
