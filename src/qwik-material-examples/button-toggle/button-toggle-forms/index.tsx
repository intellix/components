import {component$, useSignal} from '@qwik.dev/core';
import {MatButtonToggleGroup, MatButtonToggle} from '@angular-community/qwik-material/button-toggle';

/**
 * Port of `src/components-examples/material/button-toggle/button-toggle-forms`
 * (button-toggle-forms-example.html/.ts) — material.angular.dev's "Button-toggles with forms"
 * example. No CSS file upstream. Both groups are standalone (`[(ngModel)]`/`[formControl]`, NO
 * enclosing `<form>` at all) — this port has no Angular Forms, so each is a plain signal pair
 * wired through `MatButtonToggleGroup`'s `formBound`/`touched`/`dirty`/`invalid`/`onTouched$`
 * contract (see `qwik-material/button-toggle/SYNC.md`'s "Form state" section, including its
 * CLICK-driven — not blur-driven — `onTouched$` timing, a real, confirmed-live difference from
 * checkbox/radio/slide-toggle). `invalid` is always `false` (no validators in this example).
 *
 * `fontStyleControl = new FormControl('')` starts as the empty string, NOT `undefined` — like
 * `qwik-cdk-dev-app/.../formisch/account/formisch-bindings.ts`'s own `matRadioGroupBindings`
 * (same underlying port limitation, confirmed live for button-toggle too), this port's roving-
 * tabindex bootstrap only recognizes `undefined` as "nothing selected yet" — passing a literal
 * `''` would give every toggle `tabIndex={-1}` instead of the correct "first enabled toggle gets
 * 0" (real Angular's own `_initializeTabIndex()` treats `''` and `undefined` identically: neither
 * matches any button's own value, so `this.selected` is falsy either way). Converted at this
 * wiring boundary (`|| undefined`), same fix, same reasoning — the DISPLAYED text below still
 * reads the raw signal (`''`), matching upstream's literal `{{fontStyleControl.value}}`.
 */
export default component$(() => {
  const fontStyle = useSignal<string | undefined>(undefined);
  const fontStyleTouched = useSignal(false);
  const fontStyleDirty = useSignal(false);

  const fontStyleControl = useSignal('');
  const fontStyleControlTouched = useSignal(false);
  const fontStyleControlDirty = useSignal(false);

  return (
    <button-toggle-forms-example>
      <section>
        <h4>Button Toggle inside of a Template-driven form</h4>
        <MatButtonToggleGroup
          aria-label="Font Style"
          value={fontStyle.value}
          formBound
          touched={fontStyleTouched.value}
          dirty={fontStyleDirty.value}
          invalid={false}
          onChange$={v => {
            fontStyleDirty.value = true;
            fontStyle.value = v as string | undefined;
          }}
          onTouched$={() => (fontStyleTouched.value = true)}
        >
          <MatButtonToggle value="bold">Bold</MatButtonToggle>
          <MatButtonToggle value="italic">Italic</MatButtonToggle>
          <MatButtonToggle value="underline">Underline</MatButtonToggle>
        </MatButtonToggleGroup>
        <p>Chosen value is {fontStyle.value}</p>
      </section>

      <section>
        <h4>Button Toggle inside of a Reactive form</h4>
        <MatButtonToggleGroup
          aria-label="Font Style"
          value={fontStyleControl.value || undefined}
          formBound
          touched={fontStyleControlTouched.value}
          dirty={fontStyleControlDirty.value}
          invalid={false}
          onChange$={v => {
            fontStyleControlDirty.value = true;
            fontStyleControl.value = (v as string | undefined) ?? '';
          }}
          onTouched$={() => (fontStyleControlTouched.value = true)}
        >
          <MatButtonToggle value="bold">Bold</MatButtonToggle>
          <MatButtonToggle value="italic">Italic</MatButtonToggle>
          <MatButtonToggle value="underline">Underline</MatButtonToggle>
        </MatButtonToggleGroup>
        <p>Chosen value is {fontStyleControl.value}</p>
      </section>
    </button-toggle-forms-example>
  );
});
