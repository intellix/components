import {$, component$, useSignal, useStyles$, useTask$, type Signal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatChipGrid, type MatChipRowDef} from '@angular-community/qwik-material/chips';
import {MatIcon} from '@angular-community/qwik-material/icon';
import styles from './example.css?inline';

const INITIAL_KEYWORDS: readonly string[] = ['angular', 'how-to', 'tutorial', 'accessibility'];

function rowsForKeywords(
  keywords: readonly string[],
  keywordsSignal: Signal<readonly string[]>,
): MatChipRowDef[] {
  return keywords.map(keyword => ({
    key: keyword,
    content: keyword,
    removeButton: {
      content: <MatIcon>cancel</MatIcon>,
      'aria-label': `remove reactive form${keyword}`,
    },
    onRemoved$: $(() => {
      keywordsSignal.value = keywordsSignal.value.filter(k => k !== keyword);
    }),
    dynamicallyAdded: !INITIAL_KEYWORDS.includes(keyword),
  }));
}

/**
 * Port of material.angular.dev's `chips-reactive-form` docs example
 * (src/components-examples/material/chips/chips-reactive-form/). Same controlled-signal pattern
 * as `chips-template-form`/`chips-input` — see `chips-template-form/index.tsx`'s header comment
 * for why the Forms-driven distinction upstream draws collapses to one implementation here.
 *
 * UNPORTED (small, documented, not fixed): upstream binds `[formControl]="formControl"`
 * directly to `<mat-chip-grid>`, so Angular's `NgControlStatus` directive adds
 * `ng-pristine ng-untouched ng-valid` to the real `<mat-chip-grid>` host from the very first
 * render (same category as `tooltip-position`/`tooltip-delay`'s fix — see
 * qwik-material/input/SYNC.md's "aria-label prop added" entry for the established pattern).
 * Unlike `MatInput`/`MatSelect`, `MatChipGridProps` has no `touched`/`dirty`/`invalid`/
 * `formBound` fields at all (confirmed against mat-chip-grid.tsx), so there is currently no way
 * to replicate those three classes here. Tracked as an expected parity-suite failure, not
 * silently ignored.
 */
export default component$(() => {
  useStyles$(styles);
  const keywords = useSignal<readonly string[]>(INITIAL_KEYWORDS);

  const rowsSignal = useSignal<MatChipRowDef[]>([]);
  useTask$(({track}) => {
    const current = track(() => keywords.value);
    rowsSignal.value = rowsForKeywords(current, keywords);
  });

  return (
    <chips-reactive-form-example>
      <section>
        <h4>Chips inside of a Reactive form</h4>
        <MatFormField
          class="example-form-field"
          label={<MatLabel>Video keywords</MatLabel>}
          control={
            <MatChipGrid
              controlType="mat-chip-grid"
              value={keywords.value.length ? keywords.value : undefined}
              aria-label="Enter reactive form keywords"
              rows={rowsSignal}
              input={{
                placeholder: 'New keyword...',
                onTokenEnd$: $((value: string, clear) => {
                  const trimmed = value.trim();
                  if (trimmed) {
                    keywords.value = [...keywords.value, trimmed];
                  }
                  clear();
                }),
              }}
            />
          }
        />
      </section>
    </chips-reactive-form-example>
  );
});
