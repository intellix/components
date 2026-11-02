import {Component, Type} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-autocomplete/. See
// button-toggle.ts for the general approach, and select.ts for the overlay-location
// investigation this file reuses almost verbatim (`mat-autocomplete`'s trigger directive is
// built on the exact same CDK primitive). Every `<input matInput [matAutocomplete]>` below is
// inside `<mat-form-field style="width: 300px">`, for the same layout-measurement reason as
// form-field.ts/select.ts (`panel-width` below specifically relies on the field's own width
// being fixed, since the panel defaults to matching it). `[(ngModel)]` (FormsModule, not
// ReactiveFormsModule) is used throughout for the same reason select.ts avoids a FormControl
// where it can: it keeps the "Value: …" `<p>` in sync for free. Component-level inputs
// (`autoActiveFirstOption`, `requireSelection`, `displayWith`, `panelWidth`,
// `hideSingleSelectionIndicator`) use `[prop]` bindings — CONFIRMED LIVE that a bare attribute
// (as upstream's own `autocomplete-auto-active-first-option-example.html`/`autocomplete-require-
// selection-example.html` write them, e.g. `<mat-autocomplete autoActiveFirstOption>`) leaks onto
// `<mat-autocomplete>`'s own (permanently empty, see below) host element as a literal
// `autoactivefirstoption=""` attribute forever, because — unlike `MatMenu`'s aria inputs or
// `MatSelect`'s `[class]` setter — `MatAutocomplete` has no host binding that nulls it out. Same
// family as `<mat-checkbox checked>`; CONSUMER_SELECTOR_ATTRS doesn't need an entry since none of
// these are selector attributes, just ordinary `@Input`s that would otherwise get echoed.
//
// FILTERING — SYNCHRONOUS, COMPONENT-LEVEL, NOT RxJS (deliberately, per the task): every
// scenario keeps its own `options`/`filtered…` array and a plain `filter…(val)` method, called
// from `(ngModelChange)` (fires on every keystroke, same timing as the real `input` event) and
// `(focus)` (mirrors upstream's own `src/dev-app/autocomplete/autocomplete-demo.ts`, whose
// `(input)="reactiveStates = filterStates(reactiveInput.value)"` / `(focus)="…"` pair is the
// template this file follows) — never an RxJS `valueChanges` pipe + `async` (as several
// `components-examples/material/autocomplete/*` demos do), which would add an extra microtask
// this harness has no reason to chase. `@for (… track …)` tracks the underlying string/object
// value itself (not an index), so filtering never destroys/recreates a still-matching option's
// `MatOption` instance — CONFIRMED LIVE this is what keeps a selected option's `selected`/`id`
// state (and thus its `mat-option-N` id) stable across a refilter that still includes it (see
// `basic-filter`'s reopen-after-select step).
//
// CRITICAL, NON-OBVIOUS GOTCHA — VERIFIED LIVE, COST REAL DEBUGGING TIME while writing this file:
// `requireSelection`'s `_handleInput` (autocomplete-trigger.ts) explicitly SKIPS calling the CVA
// `_onChange` while the panel is open and `requireSelection` is true ("If selection is required we
// don't write to the CVA while the user is typing"). Since `[(ngModel)]`'s `(ngModelChange)` only
// fires when `_onChange` is actually invoked, wiring a filter through `(ngModelChange)` — as every
// OTHER scenario in this file safely does — silently NEVER REFILTERS while typing in
// `require-selection` (confirmed: typing visibly changed the input's `.value` but the option list
// stayed frozen on the previous filter). This is exactly why upstream's own
// `autocomplete-require-selection-example.ts` reads `@ViewChild('input')` and filters from a raw
// `(input)` handler instead of `(ngModelChange)`/`valueChanges` — not a stylistic choice, a
// necessity. `require-selection` below does the same (`(input)="filteredOptions =
// filterOptions(numberInput.value)"`), reading the native input's live `.value` directly.
//
// `<mat-autocomplete>` IS AN EMPTY HOST, LIKE `<mat-menu>` — VERIFIED LIVE, genuinely easy to miss:
// `MatAutocomplete`'s own template (autocomplete.html) is a *lone* `<ng-template>` — its content
// (the panel div + projected options) is only ever instantiated later, as a `TemplatePortal`, into
// the overlay. But `<mat-autocomplete>` is still a *component* (selector `mat-autocomplete`), so
// Angular still creates and renders its own host element at the declaration site — confirmed it
// stays empty (`<mat-autocomplete class="mat-mdc-autocomplete"></mat-autocomplete>`, no `id`, no
// aria-*) there forever, same category as menu.ts's `<mat-menu>` finding. UNLIKE `<mat-menu>`
// (declared as a bare sibling of its trigger in these parity files), every scenario below declares
// `<mat-autocomplete>` as a projected child of `<mat-form-field>` (same as every real-world usage
// in `components-examples/material/autocomplete/*`) — CONFIRMED LIVE this empty host tag lands
// inside `.mat-mdc-form-field-infix`, as the LAST child, directly after the `<input>` itself (i.e.
// the same content slot the input occupies, not the subscript-wrapper-adjacent slot select.ts's
// panel uses). The Qwik port must render an equivalent empty placeholder element in that exact
// position for the trigger-side comparison to pass, exactly as menu.ts's port must for `<mat-menu>`.
//
// ============================ ONE ROOT ONLY — VERIFIED LIVE ============================
// `MatAutocompleteTrigger._getOverlayPosition()` (autocomplete-trigger.ts) calls
// `.withPopoverLocation('inline')` UNCONDITIONALLY (not gated behind an opt-out token like
// select's `_popoverLocation`) on the exact same `FlexibleConnectedPositionStrategy` select.ts's
// header documents in detail (read it first) — so `getPopoverInsertionPoint()` returns a real
// element and the overlay's host lands as a plain DOM sibling via `customInsertionPoint.after(...)`,
// NEVER inside `.cdk-overlay-container`. CONFIRMED LIVE, repeatedly, across every scenario below:
// the overlay's bounding-box host (`<div popover="manual" class="cdk-overlay-popover cdk-overlay-
// connected-position-bounding-box">` — note the native HTML Popover-API `popover="manual"`
// attribute, present on select's popover too, just not called out in its header) lands as a PLAIN
// SIBLING of `.mat-mdc-text-field-wrapper`, i.e. an extra child of `<mat-form-field>` itself,
// BEFORE `.mat-mdc-form-field-subscript-wrapper` — fully inside `[data-parity-root]`. The origin
// is `this._formField.getConnectedOverlayOrigin()` (same form-field method select's header
// documents), confirmed identical even including the Safari-measurement-workaround side effect: a
// `.cdk-overlay-container` is created on first open but stays PERMANENTLY CHILDLESS. There is
// therefore nothing a second `rootSelector` test would usefully assert — every scenario below has
// exactly one `test()`, against the default `[data-parity-root]` root.
//
// UNLIKE SELECT: NO FIRST-OPEN-VS-LATER-OPEN QUIRK — VERIFIED LIVE (opened/closed the same
// autocomplete 3+ times in a row, inspected the popover's parent each time; always identical).
// Select's quirk (its header's "FIRST OPEN vs. EVERY LATER OPEN" section) is caused specifically
// by `MatSelect` setting `_preferredOverlayOrigin` imperatively and then relying on a *template*
// binding (`[cdkConnectedOverlayOrigin]`) that only re-evaluates on the NEXT change-detection pass
// to feed the overlay directive. `MatAutocompleteTrigger._getConnectedElement()` is instead called
// directly, as a plain synchronous TypeScript method, from inside the very same `_attachOverlay()`
// call that creates the overlay — there is no template-binding staleness window. The popover lands
// inside `<mat-form-field>` from the very first open, every time.
//
// INPUT ARIA/ROLE WIRING (`MatAutocompleteTrigger`'s host bindings) — CONFIRMED LIVE via
// `element.attributes` (not just read from source): `autocomplete="off"` (always, the trigger's
// own default-valued `@Input('autocomplete')`), `role="combobox"`, `aria-autocomplete="list"`,
// `aria-haspopup="listbox"`, `aria-expanded="false"/"true"` (always present, stringified),
// `aria-controls` (present ONLY while `panelOpen`, value = the panel's own id, see below),
// `aria-activedescendant` (present only while `panelOpen && activeOption`, value = the active
// `<mat-option>`'s id). **`aria-owns` is NEVER present on this input, under any scenario below —
// confirmed by dumping every attribute name live.** (Don't assume one; `mat-select`'s own trigger
// also has no `aria-owns` — ownership here is expressed purely through `aria-controls`.) All of
// autocompleteDisabled-conditional null-outs (`matAutocompleteDisabled`) are not exercised below,
// to keep the scenario count focused.
//
// IDS (`_IdGenerator`, the SAME app-global counters select.ts's options/optgroups use — digits
// squashed by the harness regardless): `mat-autocomplete-N` for `MatAutocomplete.id` — CONFIRMED
// LIVE this is used DIRECTLY as the panel `<div>`'s own `[id]`, with NO "-panel" suffix (unlike
// `mat-select-N` → panel `mat-select-N-panel`'s string concatenation) — so the SAME id also
// appears verbatim as the trigger's `aria-controls` value. `mat-option-N` per `<mat-option>`,
// `mat-optgroup-label-N` per `<mat-optgroup>`'s label span — exactly select.ts's id shapes, same
// counters (select and autocomplete options interleave into one global sequence at runtime, though
// within a single fresh page load each scenario starts its own numbering from whatever the page
// has already minted).
//
// PANEL ARIA-LABELLEDBY — CONFIRMED LIVE, same mechanism as select's `aria-labelledby` (see
// select.ts's LABEL WIRING note), but landing on the PANEL, not the trigger: the panel's
// `[attr.aria-labelledby]="_getPanelAriaLabelledby(formFieldId)"` resolves to the form field's
// floating-label id (`mat-mdc-form-field-label-N`, captured once via `this._formField?.getLabelId()`
// when the `TemplatePortal` is first constructed) UNLESS `ariaLabel` is set (then `aria-label`
// instead, `aria-labelledby` entirely absent — not exercised below, see select.ts's analogous
// `ariaLabel` carve-out). Every scenario below keeps a `<mat-label>` present for its whole
// lifetime, so this stays stable; not re-verified against a label-less field here (see select.ts's
// own `placeholder` scenario for that general shape).
//
// ACTIVE/SELECTED STATE (confirmed live, same mechanism as select.ts's ACTIVE/HIGHLIGHT STATE,
// condensed to what differs): the active option gets class `mat-mdc-option-active`
// (`ActiveDescendantKeyManager` — real DOM focus never leaves the input; `active` just drives
// style/aria-activedescendant). The selected option (there is at most one — see MULTIPLE
// SELECTION below) gets `mdc-list-item--selected` plus `aria-selected="true"` (every other option
// always carries `aria-selected="false"`, never omitted) and — UNLESS `hideSingleSelectionIndicator`
// is set — a trailing `<mat-pseudo-checkbox appearance="minimal">` checkmark (no box). `-active`
// and `-selected` are independent and can diverge (arrowing away from the selected option moves
// `-active` off it while `-selected`/`aria-selected` stay put) or coincide (a freshly-selected
// option is active until the panel closes).
//
// NO MULTIPLE-SELECTION MODE — CONFIRMED LIVE, a real difference from `mat-select`: `MatOption`'s
// `multiple` getter reads `this._parent.multiple` (`MAT_OPTION_PARENT_COMPONENT`), but
// `MatAutocomplete` never declares a `multiple` property at all (unlike `MatSelect`, which has
// `[multiple]`) — so it's always `undefined`/falsy. The LEADING, full-size pseudo-checkbox that
// `mat-select`'s `multiple` mode always renders (see select.ts's MULTIPLE SELECTION note) can
// therefore NEVER appear on a `mat-autocomplete`'s options under any input combination; only the
// trailing minimal one (selected + single-selection shape) is reachable, exactly the mechanic
// `hide-single-selection-indicator` below isolates.
//
// DISABLED OPTIONS — CONFIRMED LIVE, a real difference from `mat-select`'s closed-vs-open
// asymmetry (see select.ts's DISABLED OPTIONS note): `MatAutocomplete.protected _skipPredicate()`
// (autocomplete.ts) unconditionally `return false` — NOT gated on panel-open state at all. A
// disabled option is therefore reachable by arrow-key navigation AND letter typeahead regardless
// of whether this is the panel's first open or a subsequent one (there is no "closed" state to
// speak of the way `mat-select` has — the autocomplete's "closed" state just means no panel
// exists yet). Clicking a disabled option directly IS still a genuine no-op — confirmed live —
// because `MatOption._selectViaInteraction()` (core/option/option.ts) guards on `!this.disabled`
// and simply returns, emitting no selection-change event; since the click landed INSIDE the panel,
// it isn't an "outside click" either, so the panel just stays open with nothing changed. See
// `disabled-option` below.
//
// PANEL WIDTH — CONFIRMED LIVE: `_getPanelWidth()` (autocomplete-trigger.ts) returns
// `this.autocomplete.panelWidth || this._getHostWidth()` — i.e. the explicit `panelWidth` input
// (any valid CSS size, a string OR a number) when set, else the connected element's
// `getBoundingClientRect().width` (same element as the overlay origin — effectively the form
// field's own measured width). Written as a literal pixel `width` on `.cdk-overlay-pane` itself
// (NOT the bounding-box div, which stays `width: 100%` relative to its own `inset: 0 auto auto 0`
// position). `panel-width` below sets `[panelWidth]="'500px'"` against a 300px-wide field —
// confirmed live the pane measures exactly `width: 500px`, not 300px.
//
// LABEL-FLOATING INTERACTION WITH THE OVERLAY — CONFIRMED LIVE, affects every scenario's
// after-close snapshot, easy to get wrong: `_floatLabel()`/`_resetLabel()` (autocomplete-
// trigger.ts) force the form field's `floatLabel` to `'always'` for as long as the panel is
// attached (so clicking an option with the mouse doesn't visibly "jump" the label before the
// input value updates), then explicitly reset it back to `'auto'` the instant the panel closes —
// but resetting to `'auto'` does NOT itself unfloat the label; the label's actual floated state
// under `'auto'` still follows the ordinary MDC rule (floated if focused OR non-empty value).
// CONFIRMED LIVE: closing via Escape or by selecting an option (both leave focus on the input)
// with a non-empty value keeps `mdc-floating-label--float-above` and `mat-focused` on the field
// — NOT because of the manual override (that class, `mat-mdc-form-field-label-always-float`, IS
// removed), but because the input is still genuinely focused/non-empty. Only a close that BOTH
// blurs the input AND leaves the value empty (confirmed via `require-selection`'s outside-click
// reset step) visibly unfloats the label and drops `mat-focused`. The Qwik port must compute the
// floated state the same way — from live focus/value, not from whatever the override last set —
// or these specific steps will show a false-positive diff.
//
// See the parity spec's header for the full per-scenario step sequence and root-selector
// reasoning (kept to a single root, see above).

interface AcUser {
  name: string;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Fruit</mat-label>
        <input
          matInput
          #fruitInput
          [matAutocomplete]="auto"
          [(ngModel)]="value"
          (ngModelChange)="filteredFruits = filterFruits($event)"
          (focus)="filteredFruits = filterFruits(fruitInput.value)" />
        <mat-autocomplete #auto="matAutocomplete">
          @for (fruit of filteredFruits; track fruit) {
            <mat-option [value]="fruit">{{ fruit }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
})
export class AutocompleteBasicFilter {
  value = '';
  fruits = ['Apple', 'Banana', 'Cherry', 'Date'];
  filteredFruits = this.fruits.slice();

  filterFruits(val: string): string[] {
    const filterValue = (val || '').toLowerCase();
    return this.fruits.filter(fruit => fruit.toLowerCase().includes(filterValue));
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Produce</mat-label>
        <input
          matInput
          #produceInput
          [matAutocomplete]="auto"
          [(ngModel)]="value"
          (ngModelChange)="filteredGroups = filterGroups($event)"
          (focus)="filteredGroups = filterGroups(produceInput.value)" />
        <mat-autocomplete #auto="matAutocomplete">
          @for (group of filteredGroups; track group.letter) {
            <mat-optgroup [label]="group.letter">
              @for (item of group.items; track item) {
                <mat-option [value]="item">{{ item }}</mat-option>
              }
            </mat-optgroup>
          }
        </mat-autocomplete>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
})
export class AutocompleteOptgroups {
  value = '';
  groups = [
    {letter: 'Fruits', items: ['Apple', 'Banana']},
    {letter: 'Vegetables', items: ['Carrot', 'Celery']},
  ];
  filteredGroups = this.groups;

  filterGroups(val: string) {
    const filterValue = (val || '').toLowerCase();
    if (!filterValue) return this.groups;
    return this.groups
      .map(group => ({
        letter: group.letter,
        items: group.items.filter(item => item.toLowerCase().includes(filterValue)),
      }))
      .filter(group => group.items.length > 0);
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Number</mat-label>
        <input
          matInput
          #numberInput
          [matAutocomplete]="auto"
          [(ngModel)]="value"
          (ngModelChange)="filteredOptions = filterOptions($event)"
          (focus)="filteredOptions = filterOptions(numberInput.value)" />
        <mat-autocomplete [autoActiveFirstOption]="true" #auto="matAutocomplete">
          @for (option of filteredOptions; track option) {
            <mat-option [value]="option">{{ option }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
})
export class AutocompleteAutoActiveFirstOption {
  value = '';
  options = ['One', 'Two', 'Three'];
  filteredOptions = this.options.slice();

  filterOptions(val: string): string[] {
    const filterValue = (val || '').toLowerCase();
    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Number</mat-label>
        <input
          matInput
          #numberInput
          [matAutocomplete]="auto"
          [(ngModel)]="value"
          (input)="filteredOptions = filterOptions(numberInput.value)"
          (focus)="filteredOptions = filterOptions(numberInput.value)" />
        <mat-autocomplete [requireSelection]="true" #auto="matAutocomplete">
          @for (option of filteredOptions; track option) {
            <mat-option [value]="option">{{ option }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
})
export class AutocompleteRequireSelection {
  value = '';
  options = ['One', 'Two', 'Three', 'Four', 'Five'];
  filteredOptions = this.options.slice();

  filterOptions(val: string): string[] {
    const filterValue = (val || '').toLowerCase();
    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Assignee</mat-label>
        <input
          matInput
          #userInput
          [matAutocomplete]="auto"
          [(ngModel)]="value"
          (ngModelChange)="filteredUsers = filterUsers($event)"
          (focus)="filteredUsers = filterUsers(userInput.value)" />
        <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayFn">
          @for (user of filteredUsers; track user.name) {
            <mat-option [value]="user">{{ user.name }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
    </div>
  `,
  imports: [FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
})
export class AutocompleteDisplayWith {
  value: string | AcUser = '';
  users: AcUser[] = [{name: 'Mary'}, {name: 'Shelley'}, {name: 'Igor'}];
  filteredUsers = this.users.slice();

  displayFn = (user: AcUser): string => (user && user.name ? user.name : '');

  filterUsers(val: string | AcUser): AcUser[] {
    const name = typeof val === 'string' ? val : (val?.name ?? '');
    const filterValue = name.toLowerCase();
    return this.users.filter(user => user.name.toLowerCase().includes(filterValue));
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Fruit</mat-label>
        <input matInput [matAutocomplete]="auto" [(ngModel)]="value" />
        <mat-autocomplete #auto="matAutocomplete">
          <mat-option value="Apple">Apple</mat-option>
          <mat-option value="Banana" [disabled]="true">Banana</mat-option>
          <mat-option value="Cherry">Cherry</mat-option>
          <mat-option value="Date">Date</mat-option>
        </mat-autocomplete>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
})
export class AutocompleteDisabledOption {
  value = '';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Fruit</mat-label>
        <input
          matInput
          #fruitInput
          [matAutocomplete]="auto"
          [(ngModel)]="value"
          (ngModelChange)="filteredFruits = filterFruits($event)"
          (focus)="filteredFruits = filterFruits(fruitInput.value)" />
        <mat-autocomplete #auto="matAutocomplete" [panelWidth]="'500px'">
          @for (fruit of filteredFruits; track fruit) {
            <mat-option [value]="fruit">{{ fruit }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
})
export class AutocompletePanelWidth {
  value = '';
  fruits = ['Apple', 'Banana', 'Cherry', 'Date'];
  filteredFruits = this.fruits.slice();

  filterFruits(val: string): string[] {
    const filterValue = (val || '').toLowerCase();
    return this.fruits.filter(fruit => fruit.toLowerCase().includes(filterValue));
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Fruit</mat-label>
        <input
          matInput
          #fruitInput
          [matAutocomplete]="auto"
          [(ngModel)]="value"
          (ngModelChange)="filteredFruits = filterFruits($event)"
          (focus)="filteredFruits = filterFruits(fruitInput.value)" />
        <mat-autocomplete #auto="matAutocomplete" [hideSingleSelectionIndicator]="true">
          @for (fruit of filteredFruits; track fruit) {
            <mat-option [value]="fruit">{{ fruit }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
})
export class AutocompleteHideSingleSelectionIndicator {
  value = '';
  fruits = ['Apple', 'Banana', 'Cherry', 'Date'];
  filteredFruits = this.fruits.slice();

  filterFruits(val: string): string[] {
    const filterValue = (val || '').toLowerCase();
    return this.fruits.filter(fruit => fruit.toLowerCase().includes(filterValue));
  }
}

export const AUTOCOMPLETE_SCENARIOS: Record<string, Type<unknown>> = {
  'basic-filter': AutocompleteBasicFilter,
  'optgroups': AutocompleteOptgroups,
  'auto-active-first-option': AutocompleteAutoActiveFirstOption,
  'require-selection': AutocompleteRequireSelection,
  'display-with': AutocompleteDisplayWith,
  'disabled-option': AutocompleteDisabledOption,
  'panel-width': AutocompletePanelWidth,
  'hide-single-selection-indicator': AutocompleteHideSingleSelectionIndicator,
};
