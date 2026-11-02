import {component$} from '@qwik.dev/core';
import {MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatIcon} from '@angular-community/qwik-material/icon';

/**
 * Port of material.angular.dev's `form-field-appearance` docs example
 * (src/components-examples/material/form-field/form-field-appearance/) — the same form field
 * twice, `appearance="fill"` then `"outline"`. The real template's `<mat-icon matSuffix>` puts
 * the directive attribute DIRECTLY on the `<mat-icon>` — no wrapping element at all (confirmed
 * live: the real DOM has `<div class="mat-mdc-form-field-icon-suffix"><mat-icon matsuffix ...>`,
 * no extra `<span>`). `<MatIconSuffix>` (used by `prefix-suffix-icon`'s own mirror scenario)
 * exists for upstream's OTHER shape — a consumer-authored bare `<span matIconSuffix>` with no
 * element of its own — so here `<MatIcon>` is passed directly as `iconSuffix`, unwrapped;
 * `MatFormField` already adds the `.mat-mdc-form-field-icon-suffix` container regardless of
 * what's inside.
 *
 * NOTE (read before changing this file): this example's own upstream template wraps each
 * `<mat-form-field>` in a literal `<p>`. Per the HTML5 parsing algorithm, `MatFormField`'s own
 * first rendered child is a `<div class="mat-mdc-text-field-wrapper">`, and a `<div>` start tag
 * always closes any open `<p>` in scope, however deeply nested through an intervening custom
 * element — so Qwik's SSR text, once the browser parses it, always splits this `<p>` apart the
 * same way `select-disabled`'s `<p><mat-checkbox>` does (see that example's own doc comment and
 * `specs/examples-forms/angular-parity.spec.ts`'s `EXPECTED_FAILURES`). This is marked
 * `test.fail` there for exactly that reason — not a bug in this file.
 */
export default component$(() => {
  return (
    <form-field-appearance-example>
      <p>
        <MatFormField
          appearance="fill"
          label={<MatLabel>Fill form field</MatLabel>}
          control={<MatInput placeholder="Placeholder" />}
          iconSuffix={<MatIcon>sentiment_very_satisfied</MatIcon>}
          hintStart={<MatHint>Hint</MatHint>}
        />
      </p>
      <p>
        <MatFormField
          appearance="outline"
          label={<MatLabel>Outline form field</MatLabel>}
          control={<MatInput placeholder="Placeholder" />}
          iconSuffix={<MatIcon>sentiment_very_satisfied</MatIcon>}
          hintStart={<MatHint>Hint</MatHint>}
        />
      </p>
    </form-field-appearance-example>
  );
});
