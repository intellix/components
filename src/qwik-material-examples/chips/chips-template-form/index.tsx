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
      'aria-label': `remove template form${keyword}`,
    },
    onRemoved$: $(() => {
      keywordsSignal.value = keywordsSignal.value.filter(k => k !== keyword);
    }),
    dynamicallyAdded: !INITIAL_KEYWORDS.includes(keyword),
  }));
}

/**
 * Port of material.angular.dev's `chips-template-form` docs example
 * (src/components-examples/material/chips/chips-template-form/). Upstream's whole point is
 * `[(ngModel)]` (`FormsModule`) binding `<mat-chip-grid>` to a signal — there is no Angular
 * Forms integration in this port (see `qwik-material/chips/SYNC.md`), so this is the same
 * controlled-signal pattern as `chips-input`/`chips-reactive-form`. The three examples are
 * functionally identical here; only the section heading differs, matching upstream's own
 * "Angular Forms API used" framing even though the underlying Qwik implementation can't.
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
    <chips-template-form-example>
      <section>
        <h4>Chips inside of a Template-driven form</h4>
        <MatFormField
          class="example-form-field"
          label={<MatLabel>Video keywords</MatLabel>}
          control={
            <MatChipGrid
              controlType="mat-chip-grid"
              value={keywords.value.length ? keywords.value : undefined}
              aria-label="Enter template form keywords"
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
    </chips-template-form-example>
  );
});
