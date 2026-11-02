import {Component, Type} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-form-field/. See
// button-toggle.ts for the general approach. Component-level inputs (`mat-form-field`'s
// `appearance`, `floatLabel`, `hideRequiredMarker`, `subscriptSizing`, `color`, `hintLabel`) use
// `[prop]="...'literal'"` bindings. Native `<input>`/`<textarea>` attributes that a real
// consumer writes directly (`placeholder`, `type`, `required`, `disabled`, `readonly`, `value`)
// are written as plain attributes, even though several of them (`required`, `disabled`,
// `readonly`, `placeholder`, `type`, `value`, `name`) are ALSO `@Input()`s on `MatInput` — a
// static attribute that matches an `@Input` name is read as that input's initial value by
// Angular, same mechanism noted in checkbox.ts, but here there is no separate component host
// to "echo" onto: `MatInput` is a directive on the native element itself, so there is no
// Angular/Qwik discrepancy to worry about (unlike `<mat-checkbox checked>`).
//
// Every `<mat-form-field>` below is given an explicit `style="width: 300px"`. This is NOT
// cosmetic: the outline appearance measures real layout (`Element.scrollWidth` for the floating
// label, `getBoundingClientRect().width` for prefix/suffix containers) to size the notch and
// (when a prefix/suffix is present) to offset the label — see the big comment in the parity
// spec for the exact formulas. A fixed width keeps that layout identical regardless of
// surrounding dev-app chrome, so the two apps measure the same thing.
//
// ANIMATIONS (same shape as expansion.ts's 200ms note, see that file): every `<mat-form-field>`
// below runs with Angular's default (animations enabled, the dev-app's default) and therefore
// gains class `mat-form-field-animations-enabled` on its host ~300ms after `ngAfterViewInit`
// (`MatFormField.ngAfterViewInit`, `src/material/form-field/form-field.ts`) — once, never
// removed. Until that class lands, the SCSS that defines the line-ripple/floating-label CSS
// *transitions* doesn't even apply (`form-field.scss` gates `private-text-field-animations` on
// `.mat-form-field-animations-enabled`), so interacting with a field before the 300ms mark would
// skip transitions entirely. The parity spec's `settle` step waits for the class on every field
// before doing anything else, exactly like expansion.ts/its spec. The Qwik port must add the
// same class on the same ~300ms delay.
//
// See the parity spec's header comment for the full per-scenario DOM contract (ids, classes,
// aria wiring, the `aria-invalid="false"`/`aria-required="false"` default-attribute quirk, the
// `readonly="true"` string quirk, and the ng-* class / error-state contract).

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Email</mat-label>
        <input matInput placeholder="pat@example.com" #emailInput (input)="value = emailInput.value" />
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldFillBasic {
  value = '';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field [appearance]="'outline'" style="width: 300px">
        <mat-label>Email</mat-label>
        <input matInput placeholder="pat@example.com" #emailInput (input)="value = emailInput.value" />
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldOutlineBasic {
  value = '';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field [floatLabel]="'always'" style="width: 300px">
        <mat-label>Email</mat-label>
        <input matInput placeholder="pat@example.com" #emailInput (input)="value = emailInput.value" />
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldFloatAlways {
  value = '';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Username</mat-label>
        <input matInput placeholder="jdoe" />
        <mat-hint align="start">Letters and numbers only</mat-hint>
        <mat-hint align="end">Max 20</mat-hint>
      </mat-form-field>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldHintStartEnd {}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field [hintLabel]="'Max 10 characters'" style="width: 300px">
        <mat-label>Nickname</mat-label>
        <input matInput maxlength="10" placeholder="Ex. Nougat" #nameInput (input)="value = nameInput.value" />
        <mat-hint align="end">{{ value.length }}/10</mat-hint>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldHintLabelEnd {
  value = '';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Last name</mat-label>
        <input matInput placeholder="Doe" required />
      </mat-form-field>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldRequiredAsterisk {}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field [hideRequiredMarker]="true" style="width: 300px">
        <mat-label>Last name</mat-label>
        <input matInput placeholder="Doe" required />
      </mat-form-field>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldHideRequiredMarker {}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>City</mat-label>
        <input matInput value="Mountain View" disabled />
      </mat-form-field>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldDisabled {}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Account ID</mat-label>
        <input matInput value="ACC-10294" readonly />
      </mat-form-field>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldReadonly {}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field [floatLabel]="'always'" style="width: 300px">
        <mat-label>Amount</mat-label>
        <span matTextPrefix>$&nbsp;</span>
        <input matInput type="number" placeholder="0" />
        <span matTextSuffix>.00</span>
      </mat-form-field>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldPrefixSuffixText {}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Password</mat-label>
        <span matIconPrefix>#</span>
        <input matInput type="password" placeholder="Password" />
        <span matIconSuffix>@</span>
      </mat-form-field>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldPrefixSuffixIcon {}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Comments</mat-label>
        <textarea
          matInput
          rows="3"
          placeholder="Additional comments"
          #commentsInput
          (input)="value = commentsInput.value"
        ></textarea>
      </mat-form-field>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldTextarea {
  value = '';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Quantity</mat-label>
        <input matInput type="number" placeholder="0" #qtyInput (input)="quantity = qtyInput.value" />
      </mat-form-field>
      <mat-form-field style="width: 300px">
        <mat-label>Password</mat-label>
        <input matInput type="password" placeholder="Password" />
      </mat-form-field>
      <p>Quantity: {{ quantity }}</p>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldTypeNumberPassword {
  quantity = '';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Default (primary)</mat-label>
        <input matInput placeholder="Default" />
      </mat-form-field>
      <mat-form-field [color]="'accent'" style="width: 300px">
        <mat-label>Accent</mat-label>
        <input matInput placeholder="Accent" />
      </mat-form-field>
      <mat-form-field [color]="'warn'" style="width: 300px">
        <mat-label>Warn</mat-label>
        <input matInput placeholder="Warn" />
      </mat-form-field>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldColors {}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field [subscriptSizing]="'dynamic'" style="width: 300px">
        <mat-label>Nickname</mat-label>
        <input matInput placeholder="Ex. Nougat" />
        <mat-hint>Shown only while there's room</mat-hint>
      </mat-form-field>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule],
})
export class FormFieldSubscriptDynamic {}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field style="width: 300px">
        <mat-label>Full name</mat-label>
        <input matInput [formControl]="nameControl" placeholder="Jane Doe" />
        @if (nameControl.invalid) {
          <mat-error>Name is required</mat-error>
        }
      </mat-form-field>
      <mat-form-field style="width: 300px">
        <mat-label>Email</mat-label>
        <input matInput [formControl]="emailControl" placeholder="pat@example.com" />
        @if (emailControl.hasError('required')) {
          <mat-error>Email is required</mat-error>
        }
        @if (emailControl.hasError('email')) {
          <mat-error>Enter a valid email</mat-error>
        }
      </mat-form-field>
    </div>
  `,
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule],
})
export class FormFieldErrorState {
  nameControl = new FormControl('', Validators.required);
  emailControl = new FormControl('', [Validators.required, Validators.email]);
}

export const FORM_FIELD_SCENARIOS: Record<string, Type<unknown>> = {
  'fill-basic': FormFieldFillBasic,
  'outline-basic': FormFieldOutlineBasic,
  'float-always': FormFieldFloatAlways,
  'hint-start-end': FormFieldHintStartEnd,
  'hint-label-end': FormFieldHintLabelEnd,
  'required-asterisk': FormFieldRequiredAsterisk,
  'hide-required-marker': FormFieldHideRequiredMarker,
  'disabled': FormFieldDisabled,
  'readonly': FormFieldReadonly,
  'prefix-suffix-text': FormFieldPrefixSuffixText,
  'prefix-suffix-icon': FormFieldPrefixSuffixIcon,
  'textarea': FormFieldTextarea,
  'type-number-password': FormFieldTypeNumberPassword,
  'colors': FormFieldColors,
  'subscript-dynamic': FormFieldSubscriptDynamic,
  'error-state': FormFieldErrorState,
};
