import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatRadioGroup, MatRadioButton} from '@angular-community/qwik-material/radio';
import styles from './example.css?inline';

/**
 * Port of `src/components-examples/material/radio/radio-ng-model`
 * (radio-ng-model-example.html/.ts/.css) — material.angular.dev's "Radios with ngModel" example.
 * Upstream binds `<mat-radio-group [(ngModel)]="favoriteSeason">` with NO enclosing `<form>` at
 * all (a standalone `ngModel`, same category as `core/ripple-overview`'s checkboxes) — this port
 * has no Angular Forms, so `favoriteSeason` is a plain signal, with a separate `touched`/`dirty`
 * pair wired through `MatRadioGroup`'s `formBound`/`touched`/`dirty`/`invalid`/`onTouched$`
 * contract (see `qwik-material/radio/SYNC.md`'s "Form state" section) — `invalid` is always
 * `false` (no validators in this example). `onChange$` marks `dirty` the instant a season is
 * picked; `onTouched$` (fired on blur of ANY radio in the group — see that SYNC.md section for
 * the exact, confirmed-live "even moving within the group" timing) marks `touched`.
 */
export default component$(() => {
  useStyles$(styles);
  const favoriteSeason = useSignal('');
  const touched = useSignal(false);
  const dirty = useSignal(false);
  const seasons = ['Winter', 'Spring', 'Summer', 'Autumn'];

  return (
    <radio-ng-model-example>
      <label id="example-radio-group-label">Pick your favorite season</label>
      <MatRadioGroup
        aria-labelledby="example-radio-group-label"
        class="example-radio-group"
        value={favoriteSeason.value || undefined}
        formBound
        touched={touched.value}
        dirty={dirty.value}
        invalid={false}
        onChange$={value => {
          dirty.value = true;
          favoriteSeason.value = (value as string) ?? '';
        }}
        onTouched$={() => (touched.value = true)}
      >
        {seasons.map(season => (
          <MatRadioButton key={season} class="example-radio-button" value={season}>
            {season}
          </MatRadioButton>
        ))}
      </MatRadioGroup>
      <div>Your favorite season is: {favoriteSeason.value}</div>
    </radio-ng-model-example>
  );
});
