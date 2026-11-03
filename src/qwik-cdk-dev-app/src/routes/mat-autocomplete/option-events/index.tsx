import {component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatAutocomplete,
  type MatAutocompleteOptionDef,
} from '@angular-community/qwik-material/autocomplete';

/**
 * Bespoke scenario (no matching upstream docs example) exercising
 * `optionSelected`/`opened`/`closed`/`optionActivated` — see
 * `qwik-material/autocomplete/SYNC.md`'s dedicated section. Every event
 * appends a plain-text log line the Playwright spec reads back, so the exact
 * firing sequence (not just "did it fire at all") is observable.
 */
const FRUITS = ['Apple', 'Banana', 'Cherry', 'Date'];

function filterFruits(val: string): MatAutocompleteOptionDef[] {
  const filterValue = (val || '').toLowerCase();
  return FRUITS.filter(fruit => fruit.toLowerCase().includes(filterValue)).map(fruit => ({
    value: fruit,
    label: fruit,
  }));
}

export default component$(() => {
  const value = useSignal('');
  const filteredFruits = useSignal<MatAutocompleteOptionDef[]>(filterFruits(''));
  const log = useSignal<string[]>([]);

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Fruit</MatLabel>}
          control={
            <MatAutocomplete
              value={value.value}
              options={filteredFruits}
              onInput$={(_, el) => (filteredFruits.value = filterFruits(el.value))}
              onFocus$={(_, el) => (filteredFruits.value = filterFruits(el.value))}
              onValueChange$={v => {
                value.value = v as string;
              }}
              onOpened$={() => {
                log.value = [...log.value, 'opened'];
              }}
              onClosed$={() => {
                log.value = [...log.value, 'closed'];
              }}
              onOptionSelected$={event => {
                log.value = [...log.value, `optionSelected:${event.option.value}`];
              }}
              onOptionActivated$={event => {
                log.value = [...log.value, `optionActivated:${event.option?.value ?? 'null'}`];
              }}
            />
          }
        />
        <p>Value: {value.value}</p>
        <ul data-testid="event-log">
          {log.value.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
