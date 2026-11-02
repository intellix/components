import {component$} from '@qwik.dev/core';
import {MatCard, MatCardTitle, MatCardSubtitle} from '@angular-community/qwik-material/card';
import {renderInlineMarkdown} from '../lib/inline-markdown';

export interface EntryCardProps {
  href: string;
  name: string;
  summary: string;
}

/** A single card in the components/CDK/guides grids — dogfoods `<MatCard appearance="outlined">`. */
export default component$<EntryCardProps>(({href, name, summary}) => (
  <a href={href} class="docs-card-link">
    <MatCard appearance="outlined" class="docs-entry-card">
      <MatCardTitle>{name}</MatCardTitle>
      <MatCardSubtitle>{renderInlineMarkdown(summary)}</MatCardSubtitle>
    </MatCard>
  </a>
));
