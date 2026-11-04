import {component$} from '@qwik.dev/core';
import {useMatErrorStateMatcherProvider} from '@angular-community/qwik-material/core';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

/**
 * Bespoke scenario (no matching upstream docs example) exercising the two BUILT-IN
 * `ErrorStateMatcher` string modes — `'touched'` (upstream's default `ErrorStateMatcher`) and
 * `'dirty'` (upstream's `ShowOnDirtyErrorStateMatcher`) — and the app-wide
 * `useMatErrorStateMatcherProvider('dirty')` default vs. a per-control override. See
 * `qwik-material/core/error-state-matcher.ts`'s doc comment.
 *
 * - `app-default`: no `errorStateMatcher` prop of its own — picks up the provider's app-wide
 *   `'dirty'` default, so the error shows the moment it becomes dirty (a single keystroke),
 *   without waiting for blur.
 * - `override-touched`: sets `errorStateMatcher="touched"` directly, overriding the provider's
 *   `'dirty'` default back to upstream's own default behavior (waits for blur).
 */
export default component$(() => {
  const dirtyModeField = useMatFormControl({value: ''});
  const touchedModeField = useMatFormControl({value: ''});
  const invalid = (value: string) => value === '';

  useMatErrorStateMatcherProvider('dirty');

  return (
    <>
      <div data-parity-root>
        <div data-testid="app-default">
          <MatFormField
            label={<MatLabel>Uses app default (dirty)</MatLabel>}
            touched={dirtyModeField.touched}
            dirty={dirtyModeField.dirty}
            invalid={invalid(dirtyModeField.value)}
            control={
              <MatInput
                formBound
                required
                value={dirtyModeField.value}
                touched={dirtyModeField.touched}
                dirty={dirtyModeField.dirty}
                invalid={invalid(dirtyModeField.value)}
                onInput$={(_, el) => dirtyModeField.setValue$(el.value)}
                onBlur$={() => dirtyModeField.markAsTouched$()}
              />
            }
          />
        </div>
        <div data-testid="override-touched">
          <MatFormField
            label={<MatLabel>Overrides to touched</MatLabel>}
            touched={touchedModeField.touched}
            dirty={touchedModeField.dirty}
            invalid={invalid(touchedModeField.value)}
            control={
              <MatInput
                formBound
                required
                errorStateMatcher="touched"
                value={touchedModeField.value}
                touched={touchedModeField.touched}
                dirty={touchedModeField.dirty}
                invalid={invalid(touchedModeField.value)}
                onInput$={(_, el) => touchedModeField.setValue$(el.value)}
                onBlur$={() => touchedModeField.markAsTouched$()}
              />
            }
          />
        </div>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
