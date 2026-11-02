import {Component, Type} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-select/. See
// button-toggle.ts for the general approach. `<mat-select>` is always hosted inside
// `<mat-form-field>` below (same as `matInput` — see form-field.ts), and every field gets a
// fixed `style="width: 300px"` for the same reason form-field.ts's scenarios do (the outline
// appearance measures real layout; see its big WIDTH comment). All component-level inputs use
// `[prop]="...'literal'"`/`[(value)]` bindings per the harness's static-attribute-echo rule — a
// static attribute matching an `@Input` name (e.g. a bare `placeholder="…"`) would be echoed
// forever onto the `<mat-select>` host (same family as `<mat-checkbox checked>`, since
// `MatSelect`'s host bindings never null it out the way `MatMenu`'s do), so none of the
// scenarios below write one.
//
// NON-OBVIOUS, VERIFIED LIVE (http://localhost:4200/qwik-parity/mat-select/<scenario>, Chromium):
// unlike every other overlay-based component with a parity spec so far (menu, tooltip, dialog),
// `<mat-select>`'s panel does NOT render into `.cdk-overlay-container`. `MatSelect` passes
// `[cdkConnectedOverlayUsePopover]="_popoverLocation"` on its `cdk-connected-overlay` template
// (select.html), and its constructor sets `_popoverLocation = 'inline'` (not the connected-
// overlay directive's own default of `'global'`) unless an app-wide `OVERLAY_DEFAULT_CONFIG`
// opts out — see `FlexibleConnectedPositionStrategy.getPopoverInsertionPoint()`
// (src/cdk/overlay/position/flexible-connected-position-strategy.ts): for `'inline'` it returns
// the overlay's origin element, and `OverlayRef._attachHost()`
// (src/cdk/overlay/overlay-ref.ts) then does `customInsertionPoint.after(this._host)` instead of
// appending to the overlay container. `OverlayRef._attachHost()`'s OWN "use the overlay
// container" branch is never taken — but `.cdk-overlay-container` can still end up created
// EMPTY as an unrelated side effect: `FlexibleConnectedPositionStrategy._getContainerRect()`
// (src/cdk/overlay/position/flexible-connected-position-strategy.ts) unconditionally calls
// `overlayContainer.getContainerElement()`, even for an inline/popover overlay, purely to borrow
// its full-viewport dimensions for a Safari measurement workaround — confirmed live: after
// opening any select below, the ONLY `.cdk-overlay-container` in the document is a permanently
// childless `<div class="cdk-overlay-container" style="">`, outside `[data-parity-root]` and
// never asserted by the parity spec (see that file's header for why one root is enough). The
// panel's `.cdk-overlay-connected-position-bounding-box` host — the ACTUAL panel markup — lands
// as a
// PLAIN SIBLING right after `.mat-mdc-text-field-wrapper`, i.e. as an extra child of
// `<mat-form-field>` itself, before `.mat-mdc-form-field-subscript-wrapper` — fully inside
// `[data-parity-root]`. (The origin is the form field's `_textField` ElementRef —
// `MatFormField.getConnectedOverlayOrigin()` — not the select's own narrower trigger div; see
// `MatSelect.open()`, which reads `_parentFormField.getConnectedOverlayOrigin()` before
// measuring/positioning.) The backdrop (always present — `cdkConnectedOverlayHasBackdrop` on
// select.html has no binding, so it can't be turned off, unlike menu's `hasBackdrop`) is
// `prepend`ed inside that SAME host (`OverlayRef._attachBackdrop`'s popover branch), i.e. also
// inside `[data-parity-root]`. The practical upshot: THERE IS ONLY ONE ROOT for select's parity
// spec, `[data-parity-root]` itself — no second `.cdk-overlay-container` comparison is needed or
// possible (the harness's dual-root helper already handles a selector matching zero elements on
// both sides identically, see `expectMaterialParity`'s `aCount`/`qCount` check, but there is
// nothing to gain from asserting zero twice). The Qwik port must likewise render the select panel
// as a plain DOM sibling inside the form field, not into a Qwik CDK overlay container.
//
// IDs (`_IdGenerator`, one app-global counter, digits squashed by the harness regardless):
// `mat-select-N` (the `<mat-select>` host's own `id`), `mat-select-value-N` (the
// `.mat-mdc-select-value` div — NOT shared with the host id), `mat-option-N` (each
// `<mat-option>`), `mat-optgroup-label-N` (each `<mat-optgroup>`'s label span). The panel's own
// `id` is a STRING CONCATENATION, not a fresh counter value: `[attr.id]="id + '-panel'"`
// (select.html) — e.g. host `mat-select-3` → panel `mat-select-3-panel`; both squash to
// `mat-select-#` / `mat-select-#-panel` under the harness's digit-replacement, which treats them
// as two independent tokens (confirmed the harness's `normalizeIdValue` only special-cases the
// `cdk-describedby-message-` prefix, so this ordinary suffix needs no special handling).
//
// LABEL WIRING — confirmed live, easy to get backwards: `MatSelect.disableAutomaticLabeling =
// true` (set specifically "to avoid issues like #27241" — see select.ts), so unlike `matInput`,
// mat-form-field's floating `<label>` NEVER gets a `for` attribute pointing at the select (no
// `for="mat-select-N"` anywhere, even though the label DOES float/behave the same visually). The
// select's own `aria-labelledby` (host binding, computed by `_getTriggerAriaLabelledby`) instead
// points at the floating label's OWN id (`mat-mdc-form-field-label-N`) — this is set via a raw
// `setAttribute`/`removeAttribute` call in `ngDoCheck` (not a template `[attr.aria-labelledby]`
// binding), specifically to dodge an "ExpressionChangedAfterItHasBeenCheckedError" since part of
// the value depends on a content query. No scenario below sets `[aria-label]`; see checkbox.ts's
// `aria-label`/`aria-labelledby` scenarios for that general pattern — select's own `ariaLabel`
// input, when set, instead REPLACES `aria-labelledby` with a plain `aria-label` (same
// `_getTriggerAriaLabelledby`/`_getPanelAriaLabelledby` short-circuit), not covered here to keep
// the scenario count focused on select-specific behavior.
//
// ACTIVE/HIGHLIGHT STATE (confirmed live): an open panel's currently-active `<mat-option>` gets
// class `mat-mdc-option-active` (from `ActiveDescendantKeyManager` calling `setActiveStyles()`/
// `setInactiveStyles()` — NOT a focus/FocusMonitor class; real DOM focus never leaves the
// `<mat-select>` host while the panel is open) and is the target of the host's
// `aria-activedescendant` (present ONLY while `panelOpen`, see `_getAriaActiveDescendant`). The
// SELECTED option (single-selection) additionally gets `mdc-list-item--selected` and
// `aria-selected="true"` (every other option gets `aria-selected="false"`, never omitted — see
// `[attr.aria-selected]="selected"`, which Angular stringifies). `mat-mdc-option-active` and
// `mdc-list-item--selected` are independent and can overlap (the selected option starts active
// when the panel opens — see `_highlightCorrectOption`) or diverge (arrowing away moves `-active`
// off the selected option while `-selected`/`aria-selected` stay put).
//
// DISABLED OPTIONS, closed vs. open (confirmed live, a genuinely surprising asymmetry):
// `MatSelect._skipPredicate` returns `option.disabled` ONLY while the panel is CLOSED — while
// OPEN it always returns `false`. Since the same predicate gates both arrow-key navigation AND
// letter-key typeahead (`ActiveDescendantKeyManager.withTypeAhead`'s matching honors
// `skipPredicate`, see `ListKeyManager` in cdk/a11y), a disabled option is completely
// unreachable by keyboard while closed (both navigating onto it and typing its first letter skip
// it) but CAN be highlighted (never selected — `_selectViaInteraction` still checks
// `!this.disabled`) by the same keys once the panel is open. See 'fill-basic' below, whose four
// options have distinct first letters specifically so this can be exercised directly.
//
// MULTIPLE SELECTION (confirmed live): every option gets a leading
// `<mat-pseudo-checkbox class="mat-mdc-option-pseudo-checkbox" aria-hidden="true">` (state
// `checked`/`unchecked` mirroring `option.selected`) whenever `multiple` is true — single-
// selection mode never renders one for an unselected option, and only renders a trailing,
// `appearance="minimal"` one for the SELECTED option (no box, checkmark only) unless
// `hideSingleSelectionIndicator` is set (not exercised here). The host gets
// `aria-multiselectable="true"` (`[attr.aria-multiselectable]="multiple"`, always present,
// stringified) and the trigger's `.mat-mdc-select-value-text` renders a single
// `.mat-mdc-select-min-line` span whose text is every selected option's `viewValue` joined with
// `", "` (`MatSelect.triggerValue`, RTL-reversed order if `dir="rtl"` — not exercised here).
// Selecting an option while `multiple` is true NEVER closes the panel (`_onSelect` only calls
// `this.close()` in the `!this.multiple` branch) and does not move keyboard focus off the panel.
//
// CUSTOM TRIGGER (`<mat-select-trigger>`, confirmed live): when present AND the select is
// non-empty, select.html's `@if (customTrigger)` branch projects it via
// `<ng-content select="mat-select-trigger">` INSTEAD OF the plain joined-text span entirely —
// the `.mat-mdc-select-min-line` span is not rendered at all in this state (fully replaced, not
// layered). `<mat-select-trigger>` itself is a bare structural directive (`MatSelectTrigger`,
// selector `mat-select-trigger`, no component/host/template of its own), so its own host
// element is whatever native/Material tag the consumer wrote it on — every scenario below (and
// upstream's own `select-custom-trigger` example) uses a plain `<span>`.
//
// REQUIRED/ERROR STATE (confirmed live, same family as form-field.ts's 'error-state' scenario,
// condensed here to what's select-specific): `MatSelect.required`'s getter falls back to
// `ngControl?.control?.hasValidator(Validators.required)`, so — exactly like `MatInput` —
// `Validators.required` alone (no literal `required` binding) yields `aria-required="true"` on
// the select host with NO `required` attribute anywhere (selects have no native `required`
// IDL property to reflect, unlike `<input>`). Unlike `MatInput`'s `aria-invalid` (which has the
// `empty && required` short-circuit — see form-field.ts), `MatSelect`'s host binds plainly
// `[attr.aria-invalid]="errorState"` — ALWAYS present (stringified `"false"`/`"true"`), no empty-
// and-required special case. `errorState`/the `ng-*` classes behave the same as form-field.ts's
// account: both need an `NgControl` (`[formControl]` here) and both only update via
// `updateErrorState()` (`ngDoCheck`), which needs the control to be `touched` to actually surface
// (`_ErrorStateTracker`'s default matcher is `control.invalid && (control.touched ||
// parentSubmitted)`). `MatSelect.close()` (select.ts) calls `this._onTouched()`
// UNCONDITIONALLY whenever a panel that was open closes — by ANY means (Escape, a backdrop
// click, Tab, or selecting an option) — so simply opening and closing the panel without ever
// picking an option is enough to flip `ng-untouched` → `ng-touched` and surface the error; no
// blur of a focusable native control is involved (the select's own host element never loses
// focus across an open/close cycle done via click/Escape).
//
// PANEL WIDTH (confirmed live): `MatSelect._getOverlayWidth` measures
// `getBoundingClientRect().width` of the SAME preferred-origin element described in the overlay-
// location note above (the form field's `.mat-mdc-text-field-wrapper`, i.e. effectively the
// `<mat-form-field>`'s own width) when `panelWidth` is `'auto'` (the default — see
// `MAT_SELECT_CONFIG`), and writes it as `[cdkConnectedOverlayWidth]` → a literal pixel
// `width` on the `.cdk-overlay-pane` itself (confirmed live on 'fill-basic': form field
// `width: 300px` via its own fixed inline style → pane `width: 300px` exactly, not 300.xxx — the
// box model is border-box with no border, so the rect width matches the authored style exactly).

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Fruit</mat-label>
        <mat-select [(value)]="value">
          <mat-option value="apple">Apple</mat-option>
          <mat-option value="banana">Banana</mat-option>
          <mat-option value="cherry" [disabled]="true">Cherry</mat-option>
          <mat-option value="date">Date</mat-option>
        </mat-select>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatSelectModule],
})
export class SelectFillBasic {
  value = '';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field [appearance]="'outline'" style="width: 300px">
        <mat-label>Fruit</mat-label>
        <mat-select [(value)]="value">
          <mat-option value="apple">Apple</mat-option>
          <mat-option value="banana">Banana</mat-option>
          <mat-option value="cherry" [disabled]="true">Cherry</mat-option>
          <mat-option value="date">Date</mat-option>
        </mat-select>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatSelectModule],
})
export class SelectOutlineBasic {
  value = '';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Fruit</mat-label>
        <mat-select [(value)]="value">
          <mat-option value="apple">Apple</mat-option>
          <mat-option value="banana">Banana</mat-option>
          <mat-option value="cherry">Cherry</mat-option>
        </mat-select>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatSelectModule],
})
export class SelectPreselectedValue {
  value = 'banana';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-select [(value)]="value" [placeholder]="'Choose a fruit'">
          <mat-option value="apple">Apple</mat-option>
          <mat-option value="banana">Banana</mat-option>
          <mat-option value="cherry">Cherry</mat-option>
        </mat-select>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatSelectModule],
})
export class SelectPlaceholder {
  value = '';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Toppings</mat-label>
        <mat-select [(value)]="value" [multiple]="true">
          <mat-option value="cheese">Extra cheese</mat-option>
          <mat-option value="mushroom">Mushroom</mat-option>
          <mat-option value="onion">Onion</mat-option>
          <mat-option value="pepperoni">Pepperoni</mat-option>
        </mat-select>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatSelectModule],
})
export class SelectMultiple {
  value = ['mushroom', 'onion'];
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Pokemon</mat-label>
        <mat-select [(value)]="value">
          <mat-optgroup [label]="'Grass'">
            <mat-option value="bulbasaur">Bulbasaur</mat-option>
            <mat-option value="oddish">Oddish</mat-option>
          </mat-optgroup>
          <mat-optgroup [label]="'Fire'" [disabled]="true">
            <mat-option value="charmander">Charmander</mat-option>
            <mat-option value="vulpix">Vulpix</mat-option>
          </mat-optgroup>
        </mat-select>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatSelectModule],
})
export class SelectOptgroups {
  value = '';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Fruit</mat-label>
        <mat-select [(value)]="value" [disabled]="true">
          <mat-option value="apple">Apple</mat-option>
          <mat-option value="banana">Banana</mat-option>
          <mat-option value="cherry">Cherry</mat-option>
        </mat-select>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatSelectModule],
})
export class SelectDisabled {
  value = 'banana';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Fruit</mat-label>
        <mat-select [formControl]="control">
          <mat-option value="apple">Apple</mat-option>
          <mat-option value="banana">Banana</mat-option>
          <mat-option value="cherry">Cherry</mat-option>
        </mat-select>
        @if (control.invalid) {
          <mat-error>You must make a selection</mat-error>
        }
      </mat-form-field>
    </div>
  `,
  imports: [MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
})
export class SelectRequiredErrorState {
  control = new FormControl('', Validators.required);
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Color</mat-label>
        <mat-select [(value)]="value" [panelClass]="'custom-select-panel'">
          <mat-option value="red">Red</mat-option>
          <mat-option value="green">Green</mat-option>
          <mat-option value="blue">Blue</mat-option>
        </mat-select>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatSelectModule],
})
export class SelectPanelClass {
  value = '';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Toppings</mat-label>
        <mat-select [(value)]="value" [multiple]="true">
          <mat-select-trigger>
            <span>{{ value[0] || '' }}</span>
            @if (value.length > 1) {
              <span class="extra-count">(+{{ value.length - 1 }} more)</span>
            }
          </mat-select-trigger>
          <mat-option value="cheese">Extra cheese</mat-option>
          <mat-option value="mushroom">Mushroom</mat-option>
          <mat-option value="onion">Onion</mat-option>
          <mat-option value="pepperoni">Pepperoni</mat-option>
        </mat-select>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatSelectModule],
})
export class SelectCustomTrigger {
  value = ['cheese', 'mushroom', 'onion'];
}

export const SELECT_SCENARIOS: Record<string, Type<unknown>> = {
  'fill-basic': SelectFillBasic,
  'outline-basic': SelectOutlineBasic,
  'preselected-value': SelectPreselectedValue,
  'placeholder': SelectPlaceholder,
  'multiple': SelectMultiple,
  'optgroups': SelectOptgroups,
  'disabled': SelectDisabled,
  'required-error-state': SelectRequiredErrorState,
  'panel-class': SelectPanelClass,
  'custom-trigger': SelectCustomTrigger,
};
