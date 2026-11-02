import {Component, Type} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatTimepickerModule, MatTimepickerOption} from '@angular/material/timepicker';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-timepicker/. See
// button-toggle.ts for the general approach, and select.ts/autocomplete.ts for the
// overlay-location investigation this file reuses (`mat-timepicker`'s panel is built on the
// exact same CDK primitive). Every `<input matInput [matTimepicker]>` below is inside
// `<mat-form-field style="width: 300px">`, for the same layout-measurement reason as
// form-field.ts/select.ts/autocomplete.ts. All component-level inputs (`interval`, `options`,
// `matTimepickerMin`, `matTimepickerMax`, `for`, `disabled`) use `[prop]` bindings — a static
// attribute matching an `@Input` name would be echoed forever onto the owning component's host
// element (same family as `<mat-checkbox checked>`/autocomplete's `autoActiveFirstOption`,
// since neither `MatTimepicker` nor `MatTimepickerToggle` has a host binding that nulls one out).
//
// DATE ADAPTER — deterministic, no current-time dependency: `provideNativeDateAdapter()` is
// already provided app-wide (src/dev-app/main.ts), en-US locale (no `LOCALE_ID` override in this
// app), so every scenario below only needs to construct fixed `Date` objects via the local
// `time(h, m)` helper (always on 2024-01-15, a date chosen arbitrarily since only the h/m fields
// are ever displayed — `NativeDateAdapter.format`'s `timeInput`/`timeOptionLabel` formats are
// `{hour: 'numeric', minute: 'numeric'}`, which never includes the date). CONFIRMED LIVE exact
// en-US strings this produces: `12:00 AM` (midnight), `12:30 PM` (noon-thirty), `1:00 AM`/`1:30
// AM` (no leading zero on the hour), `9:00 AM`, `5:00 PM`, etc. — 12-hour clock, no seconds, a
// space before AM/PM. Parsing (`NativeDateAdapter.parseTime`, used by typed/blurred input and by
// `matTimepickerMin`/`matTimepickerMax` string transforms) accepts the same shape case-
// insensitively (`1:15 PM`, `1:15pm`, `13:15` all parse to the same time-of-day).
//
// PANEL LOCATION — ONE ROOT ONLY, VERIFIED LIVE (http://localhost:4200/qwik-parity/
// mat-timepicker/<scenario>, Chromium): `MatTimepicker._getOverlayRef()` (timepicker.ts) calls
// `.withPopoverLocation('inline')` UNCONDITIONALLY on its `FlexibleConnectedPositionStrategy` —
// same mechanism as `mat-autocomplete` (always inline, no opt-out token, unlike `mat-select`'s
// conditional `_popoverLocation`) — so the overlay's host lands as a PLAIN DOM SIBLING via
// `customInsertionPoint.after(this._host)`, NEVER inside `.cdk-overlay-container`. CONFIRMED LIVE
// across every scenario below: the panel's bounding-box host (`<div popover="manual"
// class="cdk-overlay-popover cdk-overlay-connected-position-bounding-box">`) lands as an extra
// child of `<mat-form-field>` itself — a sibling of `.mat-mdc-text-field-wrapper`, placed
// directly BEFORE `.mat-mdc-form-field-subscript-wrapper` — fully inside `[data-parity-root]`,
// exactly where select's/autocomplete's panels land (origin: `MatTimepickerInput.
// getOverlayOrigin()` returns `this._formField?.getConnectedOverlayOrigin()`, the same form-field
// method select/autocomplete use). A `.cdk-overlay-container` is still created on first open (the
// same cross-component Safari-measurement-workaround side effect documented in select.ts's
// header) but stays PERMANENTLY CHILDLESS. There is therefore nothing a second `rootSelector`
// test would usefully assert; every scenario below has exactly one `test()`, against the default
// `[data-parity-root]` root. Also CONFIRMED LIVE, a genuine difference from `mat-select`: NO
// first-open-vs-later-open quirk — `_getOverlayRef()` reads `this._input()!.getOverlayOrigin()`
// directly via a plain synchronous method call (not a template binding fed by an imperatively-set
// field), so the popover lands inside `<mat-form-field>` from the very first open, every time
// (same as autocomplete, contrast with select).
//
// NO BACKDROP — CONFIRMED LIVE (source AND live DOM inspection): `createOverlayRef(...,
// {hasBackdrop: false, ...})` is a literal, unconditional option in `_getOverlayRef()` — unlike
// `mat-select` (always has one) or `mat-menu` (`hasBackdrop` input, default true), opening a
// timepicker never creates a `.cdk-overlay-backdrop` element, at any point, under any scenario
// below. Dismissing by clicking elsewhere is instead handled entirely by `OverlayRef.
// outsidePointerEvents()` (a real pointer-event stream with no backdrop element involved): a
// pointerdown whose target is outside both the connected input (the overlay's origin) and the
// panel itself closes the picker. `document.body.click()` below exercises this.
//
// `<mat-timepicker>` IS AN EMPTY, DISPLAY:NONE HOST, SAME FAMILY AS `<mat-autocomplete>`/
// `<mat-menu>` — CONFIRMED LIVE, with one twist neither of those has: `MatTimepicker`'s own
// template (timepicker.html) is a lone `<ng-template>`, so — same as `<mat-autocomplete>` — its
// content (the listbox panel) is only ever instantiated later as a `TemplatePortal` in the
// overlay, leaving `<mat-timepicker>`'s own declaration-site host element permanently childless.
// UNLIKE `<mat-autocomplete>`/`<mat-menu>` (plain empty tags), `MatTimepicker`'s constructor calls
// `element.nativeElement.setAttribute('mat-timepicker-panel-id', this.panelId)` directly (NOT a
// template/host binding) — CONFIRMED LIVE every scenario's `<mat-timepicker>` host carries a
// literal `mat-timepicker-panel-id="mat-timepicker-panel-N"` attribute (no `class`, no other
// attribute, ever). This is THE SAME STRING as the floating panel's own `id` (no "-panel" suffix
// concatenation, unlike select's id→panel-id scheme) — i.e. one `_IdGenerator` value serves as
// both the panel's real `[id]` AND this literal, non-standard attribute name on the declaration-
// site host. Material's own global stylesheet also sets `mat-timepicker { display: none; }` (by
// tag name, not a class), so the host never paints regardless. **HARNESS NEED**: the digit inside
// `mat-timepicker-panel-id`'s VALUE is the same app-global `_IdGenerator` counter already digit-
// squashed for `id`/`aria-controls`/etc. (`ID_ATTRS` in lib/material-parity.ts), but the
// ATTRIBUTE NAME `mat-timepicker-panel-id` itself is not in that list, so its value is currently
// compared RAW — add `'mat-timepicker-panel-id'` to `ID_ATTRS` (or an equivalent prefix rule) so
// it gets the same digit-squashing as every other auto-generated id. Until then this attribute
// will produce a false-positive diff unless the Qwik port's own counter happens to match
// Angular's exactly on a given scenario.
//
// IDS (`_IdGenerator`, the SAME app-global counter select's/autocomplete's options use — digits
// squashed by the harness regardless, see the HARNESS NEED above for the one exception):
// `mat-timepicker-panel-N` for the panel `<div role="listbox">`'s own `[id]` (also echoed as
// `mat-timepicker-panel-id` on `<mat-timepicker>`, see above), `mat-option-N` per `<mat-option>`
// — exactly the id shape select.ts/autocomplete.ts already document, same global counter (all
// three components interleave into one sequence at runtime; a single fresh page load starts its
// own numbering from whatever the page has already minted).
//
// INPUT ARIA/ROLE WIRING (`MatTimepickerInput`'s host bindings, timepicker-input.ts) — CONFIRMED
// LIVE via `element.attributes`: `class="mat-timepicker-input"` (merged with `matInput`'s own
// `mat-mdc-input-element` etc. classes), `role="combobox"`, `type="text"` (a literal, STATIC host
// attribute — overwrites/ignores whatever native `type` the input would otherwise have, since no
// scenario below writes its own `type`), `aria-haspopup="listbox"` (also static), `[attr.aria-
// activedescendant]` (present ONLY while the panel is open AND an option is active — i.e. never
// on initial render, even though the panel defaults its first option active immediately on open),
// `[attr.aria-expanded]` (ALWAYS present, stringified `"false"`/`"true"`), `[attr.aria-controls]`
// (present ONLY while open, value = the panel's id), `[attr.mat-timepicker-id]` (ALWAYS present,
// value = `timepicker().panelId` — i.e. the SAME id value as `aria-controls`/the panel's `[id]`/
// `<mat-timepicker>`'s own `mat-timepicker-panel-id`, just under a 4th attribute name, regardless
// of open state — another instance of the HARNESS NEED above: `mat-timepicker-id` is likewise
// absent from `ID_ATTRS` and needs the same fix). **`aria-owns` is NEVER present**, same as
// select's/autocomplete's trigger.
//
// TOGGLE BUTTON (`MatTimepickerToggle`, timepicker-toggle.html) — a `matIconButton` (selector
// attribute, already in `CONSUMER_SELECTOR_ATTRS`) with `type="button"`, `aria-haspopup=
// "listbox"`, `[attr.aria-label]` (default, when unset, `"Open timepicker options"` —
// CONFIRMED LIVE exact string), `[attr.aria-expanded]` (ALWAYS present, mirrors the timepicker's
// `isOpen()`, stringified), `[tabIndex]` (`-1` while disabled, else `null`/absent since no host
// `tabindex` attribute was present at creation), `[disabled]`. Its own host (`<mat-timepicker-
// toggle>`) carries `class="mat-timepicker-toggle"` and a literal `tabindex` host binding that is
// ALWAYS `null` (i.e. the host element itself never gets a `tabindex` attribute; only the inner
// `<button>` is focusable). Default icon (no `matTimepickerToggleIcon` projected): an inline
// `<svg class="mat-timepicker-toggle-default-icon" height="24px" width="24px" viewBox="0 -960 960
// 960" fill="currentColor" focusable="false" aria-hidden="true">` with one `<path>` — not
// exercised with a custom icon below, to keep the scenario count focused (see upstream's own
// `timepicker-custom-icon` example for that shape).
//
// OPTION STRUCTURE / ACTIVE-SELECTED STATE — CONFIRMED LIVE, same primitives as select.ts's/
// autocomplete.ts's ACTIVE/SELECTED notes, condensed to what's timepicker-specific: `MatTimepicker`
// is its own `MAT_OPTION_PARENT_COMPONENT` but — UNLIKE `MatSelect` — declares NO `multiple`
// property at all (same absence as `MatAutocomplete`), so every option is single-selection shape:
// never a leading pseudo-checkbox, only a TRAILING `<mat-pseudo-checkbox appearance="minimal">`
// checkmark on the currently-selected option (`MatTimepicker` also declares no
// `hideSingleSelectionIndicator`, so this can never be suppressed). The active option (`Active
// DescendantKeyManager`, keyboard/open-time highlight; real DOM focus never leaves the input)
// gets class `mat-mdc-option-active` and is the target of `aria-activedescendant`; the selected
// option additionally gets `mdc-list-item--selected` + `aria-selected="true"` (every other option
// always carries `aria-selected="false"`, never omitted). `-active` and `-selected` are
// independent: on open, `_syncSelectedState` makes the matching-value option BOTH selected AND
// active (or, with no match, makes the FIRST option active-only, never selected) — confirmed via
// the `basic-toggle`/`preset-value` scenarios below. Arrowing away from the selected option moves
// `-active` off it while `-selected`/`aria-selected` stay put (see `keyboard-nav`).
//
// SELECTING A CUSTOM-LABELED OPTION STILL FORMATS THE RAW TIME — CONFIRMED LIVE: picking an
// `[options]` entry (e.g. "Lunch") assigns its underlying `Date` value to the input, then
// `_formatValue()` always re-renders the input's `.value` using `MAT_DATE_FORMATS.display.
// timeInput` (`"12:00 PM"`), NEVER the option's own `label` text — the custom label is only ever
// shown inside the open panel, never reflected back into the input. See `custom-options` below.
//
// EXIT ANIMATION — ~100ms, CONFIRMED LIVE, same category as select's/menu's exit classes: with
// animations enabled (the dev-app's default — see checkbox.ts's ANIMATIONS note; none of the
// scenarios below override `MATERIAL_ANIMATIONS`), closing (`MatTimepicker.close()`) does NOT
// detach the overlay immediately — it sets `isOpen` false (triggering `[class.mat-timepicker-
// panel-exit]="!isOpen()"` on the still-fully-populated, still-attached panel) and waits for
// either the panel's `animationend` (`_mat-timepicker-exit`, 100ms linear opacity fade) or a CDK
// fallback timer before `OverlayRef.detach()` actually removes it from the DOM. The whole popover
// subtree (bounding-box host, pane, panel) disappears only once that finishes. The parity spec
// polls for the exact expected panel count (0 or 1) with none mid-exit before every snapshot, the
// same pattern select's/menu's specs already use.
//
// MIN/MAX VALIDATION ERRORS — CONFIRMED LIVE, same family as select's/form-field's error-state
// notes: `MatTimepickerInput`'s `Validator` surfaces `matTimepickerParse` (unparseable text),
// `matTimepickerMin`/`matTimepickerMax` (parseable but out of range) as control errors — these
// drive `<mat-error>` content via `@if`, exactly like form-field.ts's/select.ts's own
// error-state scenarios; the host's `aria-invalid`/`ng-invalid`/`mat-form-field-invalid`
// contract is the SAME one those files already document in full, not re-derived here.
//
// A plain `time(h, m)` helper below builds a fixed `Date` (always 2024-01-15) so every scenario's
// displayed/parsed strings are deterministic regardless of the machine's current date/time.
//
// See the parity spec's header for the full per-scenario step sequence.

function time(hours: number, minutes: number): Date {
  return new Date(2024, 0, 15, hours, minutes, 0);
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Pick a time</mat-label>
        <input matInput [matTimepicker]="picker" [(ngModel)]="value" />
        <mat-timepicker-toggle [for]="picker" matSuffix />
        <mat-timepicker #picker />
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatTimepickerModule],
})
export class TimepickerBasicToggle {
  value: Date | null = null;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Pick a time</mat-label>
        <input matInput [matTimepicker]="picker" [(ngModel)]="value" />
        <mat-timepicker-toggle [for]="picker" matSuffix />
        <mat-timepicker #picker />
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatTimepickerModule],
})
export class TimepickerPresetValue {
  value: Date | null = time(14, 0);
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Pick a time</mat-label>
        <input matInput [matTimepicker]="picker" [(ngModel)]="value" />
        <mat-timepicker-toggle [for]="picker" matSuffix />
        <mat-timepicker [interval]="'2h'" #picker />
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatTimepickerModule],
})
export class TimepickerInterval {
  value: Date | null = null;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Pick a time</mat-label>
        <input
          matInput
          [matTimepicker]="picker"
          [matTimepickerMin]="min"
          [matTimepickerMax]="max"
          [formControl]="control" />
        <mat-timepicker-toggle [for]="picker" matSuffix />
        <mat-timepicker #picker />
        @if (control.errors?.['matTimepickerParse']) {
          <mat-error>Value isn't a valid time</mat-error>
        }
        @if (control.errors?.['matTimepickerMin']) {
          <mat-error>Value is too early</mat-error>
        }
        @if (control.errors?.['matTimepickerMax']) {
          <mat-error>Value is too late</mat-error>
        }
      </mat-form-field>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule, MatTimepickerModule, ReactiveFormsModule],
})
export class TimepickerMinMax {
  min = time(9, 0);
  max = time(17, 0);
  control = new FormControl<Date | null>(null);
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Pick a time</mat-label>
        <input matInput [matTimepicker]="picker" [(ngModel)]="value" />
        <mat-timepicker-toggle [for]="picker" matSuffix />
        <mat-timepicker [options]="customOptions" #picker />
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatTimepickerModule],
})
export class TimepickerCustomOptions {
  value: Date | null = null;
  customOptions: MatTimepickerOption<Date>[] = [
    {label: 'Breakfast', value: time(9, 0)},
    {label: 'Lunch', value: time(12, 0)},
    {label: 'Dinner', value: time(20, 0)},
  ];
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Pick a time</mat-label>
        <input matInput [matTimepicker]="picker" [(ngModel)]="value" [disabled]="true" />
        <mat-timepicker-toggle [for]="picker" matSuffix />
        <mat-timepicker #picker />
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatTimepickerModule],
})
export class TimepickerDisabled {
  value: Date | null = time(10, 0);
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Pick a time</mat-label>
        <input matInput [matTimepicker]="picker" [(ngModel)]="value" />
        <mat-timepicker-toggle [for]="picker" matSuffix />
        <mat-timepicker #picker />
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatTimepickerModule],
})
export class TimepickerKeyboardNav {
  value: Date | null = null;
}

export const TIMEPICKER_SCENARIOS: Record<string, Type<unknown>> = {
  'basic-toggle': TimepickerBasicToggle,
  'preset-value': TimepickerPresetValue,
  'interval': TimepickerInterval,
  'min-max': TimepickerMinMax,
  'custom-options': TimepickerCustomOptions,
  'disabled': TimepickerDisabled,
  'keyboard-nav': TimepickerKeyboardNav,
};
