import {component$, useSignal} from '@qwik.dev/core';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatChipGrid} from '@angular-community/qwik-material/chips';

export default component$(() => {
  const idGen = useIdGenerator();
  const inputId = useSignal(() => idGen.getId('mat-mdc-chip-list-input-'));

  return (
    <>
      <div data-parity-root>
        <MatFormField
          appearance="outline"
          style="width: 300px"
          label={<MatLabel>Fruits</MatLabel>}
          control={
            <MatChipGrid
              id={inputId.value}
              controlType="mat-chip-grid"
              value={['Lemon', 'Lime']}
              disabled
              aria-label="Enter fruits (disabled)"
              rows={[
                {
                  key: 'lemon',
                  content: 'Lemon',
                  removeButton: {content: '×', 'aria-label': 'Remove Lemon'},
                },
                {
                  key: 'lime',
                  content: 'Lime',
                  removeButton: {content: '×', 'aria-label': 'Remove Lime'},
                },
              ]}
              input={{placeholder: 'New fruit...'}}
            />
          }
        />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
