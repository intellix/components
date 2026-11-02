import {Component, ElementRef, Type, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {provideNativeDateAdapter} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatRadioModule} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

// Angular reactive-forms mirror of the Formisch (`@formisch/qwik`) + qwik-material integration
// spike's "account" example (`src/qwik-cdk-dev-app/src/routes/formisch/account/index.tsx`) — see
// that route's own header comment and `qwik-material/README.md`'s "Using with Formisch" section.
// Compared by `src/qwik-cdk-parity-tests/specs/formisch/angular-parity.spec.ts`.
//
// Field-for-field, this mirrors the Qwik side's own schema (`account-schema.ts`) using plain
// `Validators`/`FormControl`, same error MESSAGE text (so `<mat-error>` content matches exactly):
// name/email/country/contactPreference/birthday required, email also `Validators.email` (which,
// like this port's own `matEmailValidator` convention — see `core/mat-form-control.ts` — skips
// an EMPTY value rather than flagging it as a format error too; the Qwik side's valibot schema
// was deliberately written with a custom `v.check()` to match this exactly, since valibot's own
// `v.email()` does NOT skip empty values the way Angular's `Validators.email` does — see
// `account-schema.ts`'s own comment), terms `Validators.requiredTrue`, bio/newsletter optional.
//
// `contactPreference` (`<mat-radio-group>`) and `terms` (`<mat-checkbox>`) have no built-in
// Material error-message component (same as the Qwik side) — a plain, consumer-authored
// `.formisch-demo__error` div, gated the same way Material's own default `ErrorStateMatcher`
// gates everything else (`invalid && (touched || submitted)`), mirrors the Qwik side's
// `matShouldShowError()` helper exactly.
//
// `onReset()` calls the `#formDir="ngForm"` template-reference's `resetForm()` — NOT
// `this.form.reset()` — because Formisch's own `reset(form)` (no config) ALSO clears the form's
// `isSubmitted` flag back to `false` by default (`keepSubmitted` defaults to false — see
// `@formisch/qwik`'s own `ResetFormConfig` type), removing `ng-submitted` too. Angular's
// `FormGroupDirective.resetForm()` is the one API that resets BOTH the group's value/touched/
// dirty state AND the directive's own `submitted` flag in one call, matching that exactly —
// `this.form.reset()` alone would leave `submitted` (and therefore `ng-submitted`) untouched.
//
// `<mat-select>`'s `required` is deliberately NOT bound at all (unlike `<input matInput
// required>`, where it's a plain, harmless native attribute) — `MatSelect.required`'s own getter
// already falls back to `ngControl?.control?.hasValidator(Validators.required)` when never
// explicitly set (`select.ts`), so leaving it unbound still renders `aria-required="true"`/
// `mat-mdc-select-required` correctly AND avoids a real Angular Forms quirk: binding `[required]`
// ALONGSIDE `formControlName` on the SAME element activates `RequiredValidator` (`@angular/
// forms`, selector `:not([type=checkbox])[required][formControlName],...` — matches ANY element,
// not just natives) purely because BOTH attribute names are present, and THAT directive's own
// host binding reflects `required` onto whatever host it's attached to — confirmed live via a
// parity diff (`<mat-select required formControlName="...">`'s HOST carried a literal
// `required=""` attribute neither `qwik-material/select` nor upstream's own component logic adds
// on its own). `<mat-checkbox>` has no such getter fallback (`checkbox.ts`'s `required` is a
// plain `@Input`, "reflected as the `required` attribute [on the native input] only — no forms
// validation", confirmed by that exact doc comment in `qwik-material/checkbox`), so it keeps its
// explicit `[required]="true"` (needed for the INNER native input's own `required`/
// `aria-required` to render at all) and accepts the same `RequiredValidator` host-reflection as a
// documented, scenario-scoped gap — see this spec's `ignoreAttrs`.
@Component({
  template: `
    <div data-parity-root>
      <form [formGroup]="form" novalidate #formDir="ngForm" (ngSubmit)="onSubmit()">
        <div class="formisch-demo__field">
          <mat-form-field [appearance]="'outline'" style="width: 100%">
            <mat-label>Full name</mat-label>
            <input matInput formControlName="name" required />
            @if (form.controls.name.invalid) {
              <mat-error>Name is required</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="formisch-demo__field">
          <mat-form-field [appearance]="'outline'" style="width: 100%">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" required />
            @if (form.controls.email.hasError('required')) {
              <mat-error>Email is required</mat-error>
            }
            @if (form.controls.email.hasError('email')) {
              <mat-error>Enter a valid email</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="formisch-demo__field">
          <mat-form-field [appearance]="'outline'" style="width: 100%">
            <mat-label>Bio</mat-label>
            <textarea matInput formControlName="bio" rows="3"></textarea>
            <mat-hint>Optional — shown on your public profile</mat-hint>
          </mat-form-field>
        </div>

        <div class="formisch-demo__field">
          <mat-form-field [appearance]="'outline'" style="width: 100%">
            <mat-label>Country</mat-label>
            <mat-select formControlName="country">
              <mat-option value="us">United States</mat-option>
              <mat-option value="ca">Canada</mat-option>
              <mat-option value="gb">United Kingdom</mat-option>
              <mat-option value="au">Australia</mat-option>
            </mat-select>
            @if (form.controls.country.invalid) {
              <mat-error>Country is required</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="formisch-demo__field">
          <span class="formisch-demo__group-label" id="contact-preference-label">
            Contact preference
          </span>
          <mat-radio-group aria-labelledby="contact-preference-label" formControlName="contactPreference">
            <mat-radio-button [value]="'email'">Email</mat-radio-button>
            <mat-radio-button [value]="'phone'">Phone</mat-radio-button>
            <mat-radio-button [value]="'mail'">Mail</mat-radio-button>
          </mat-radio-group>
          @if (
            form.controls.contactPreference.invalid &&
            (form.controls.contactPreference.touched || formDir.submitted)
          ) {
            <div class="formisch-demo__error" role="alert">Choose a contact preference</div>
          }
        </div>

        <div class="formisch-demo__field">
          <mat-slide-toggle formControlName="newsletter">
            Send me the monthly newsletter
          </mat-slide-toggle>
        </div>

        <div class="formisch-demo__field">
          <mat-checkbox formControlName="terms" [required]="true">
            I agree to the terms and conditions
          </mat-checkbox>
          @if (form.controls.terms.invalid && (form.controls.terms.touched || formDir.submitted)) {
            <div class="formisch-demo__error" role="alert">You must accept the terms</div>
          }
        </div>

        <div class="formisch-demo__field">
          <mat-form-field [appearance]="'outline'" style="width: 100%">
            <mat-label>Birthday</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="birthday" required />
            <mat-hint>MM/DD/YYYY</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            @if (form.controls.birthday.invalid) {
              <mat-error>Birthday is required</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="formisch-demo__actions">
          <button [matButton]="'filled'" type="submit">Submit</button>
          <button [matButton]="'outlined'" type="button" (click)="formDir.resetForm()">
            Reset
          </button>
        </div>
      </form>
    </div>
  `,
  // Matches ONLY the custom (non-Material) classes the parity harness's computed-style
  // comparison can actually observe inside `[data-parity-root]` (`display`/`color` are
  // compared; `margin`/`gap`/`font-size` aren't — see `lib/material-parity.ts`'s
  // `COMPUTED_STYLE_PROPS`) — the Qwik side's own `account.css` sets the SAME values for these.
  // Everything else in that stylesheet (layout, the demo panel, spacing) is demo chrome outside
  // `[data-parity-root]`, not part of the contract, so it has no Angular-side equivalent here.
  // `!important` on the two inherited-text-color rules: Angular Material's own theme CSS sets a
  // `color` on an ancestor with equal-or-higher specificity that otherwise wins by source order
  // (this component's styles are injected after the theme, but a plain class selector apparently
  // isn't enough to override it) — confirmed live via a parity diff; cosmetic-only, so forcing it
  // is the pragmatic fix rather than chasing the exact Material selector.
  styles: `
    .formisch-demo__error { color: var(--mat-sys-error, #b3261e) !important; }
    .formisch-demo__group-label { display: block; color: rgba(0, 0, 0, 0.6) !important; }
    .formisch-demo__actions { display: flex; }
  `,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatButtonModule,
  ],
})
export class FormischAccount {
  form = new FormGroup({
    name: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    bio: new FormControl('', {nonNullable: true}),
    country: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    contactPreference: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    newsletter: new FormControl(false, {nonNullable: true}),
    terms: new FormControl(false, {nonNullable: true, validators: [Validators.requiredTrue]}),
    birthday: new FormControl<Date | null>(null, {validators: [Validators.required]}),
  });

  lastSubmitted: unknown = null;

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  onSubmit() {
    if (this.form.valid) {
      this.lastSubmitted = this.form.getRawValue();
    } else {
      this.focusFirstInvalid();
    }
  }

  /**
   * Mirrors `<Form>`'s own automatic behavior on the Qwik side: Formisch's `handleSubmit`
   * (`@formisch/qwik/internals`) calls `validateFormInput(internalFormStore, {shouldFocus:
   * true})` on EVERY submit — unconditionally, regardless of what the consumer's own
   * `onSubmit$` does — so an invalid submit always moves focus to the first invalid field's
   * registered element. Angular has no equivalent built-in behavior (confirmed live: without
   * this, an invalid submit leaves focus on the SUBMIT BUTTON that was clicked, a real,
   * reproducible parity diff this method closes) — a real Angular app wanting the same UX would
   * implement this itself too, the same way this method does: find the first invalid control's
   * element, in DOM order, and focus it. Deliberately simple (`querySelector` over the few
   * control shapes this one form actually uses) rather than a generic, reusable utility — this
   * is a parity MIRROR, not a library.
   */
  private focusFirstInvalid(): void {
    const root = this.elementRef.nativeElement;
    const controls = root.querySelectorAll<HTMLElement>(
      'input.mat-mdc-input-element, textarea.mat-mdc-input-element, mat-select, mat-radio-group input, mat-checkbox input',
    );
    for (const control of Array.from(controls)) {
      if (control.classList.contains('ng-invalid') || control.closest('.ng-invalid')) {
        control.focus();
        return;
      }
    }
  }
}

export const FORMISCH_SCENARIOS: Record<string, Type<unknown>> = {
  'account': FormischAccount,
};
