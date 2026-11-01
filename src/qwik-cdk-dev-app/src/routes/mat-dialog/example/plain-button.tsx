import {$, component$, Slot, useSignal, type QRL} from '@qwik.dev/core';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';

export interface PlainButtonProps {
  /** Marks this as the dialog's auto-focus target (upstream `cdkFocusInitial`, a bare template
   *  attribute with no backing directive at all — `@angular/cdk/a11y`'s `FocusTrap` finds it by
   *  a plain `querySelector`, see `qwik-cdk/a11y/focus-trap/focus-trap.ts`). */
  cdkFocusInitial?: boolean;
  /** Mirrors `MatDialogClose`'s own `type` host binding (`'button'` by default) — present only
   *  when this button also closes the dialog (confirmed live: upstream's bare, non-dialog-close
   *  "No Thanks" button has NO `type` attribute at all; the `[mat-dialog-close]` one does). */
  type?: 'button';
  onClick$: QRL<(event: MouseEvent) => void>;
}

/**
 * A bare, "text"-appearance `matButton` — used by `mat-dialog/example`'s dialog body for its two
 * action buttons, which the real template stacks `matButton` (bare, no appearance value) with
 * EITHER nothing else ("No Thanks") OR `[mat-dialog-close]="animal()"` + `cdkFocusInitial` ("Ok")
 * — see that route's own header comment for why this is a small local component rather than
 * `<MatButton>` (which, like `<MatMenuTrigger>`/`<MatTooltip>`, renders its own host and so can't
 * currently share one with another directive-pattern component). Unlike `mat-menu/example`'s/
 * `mat-tooltip/example`'s composed triggers, THIS button calls `useFocusOrigin()` on itself
 * directly — safe here because, unlike those two cases, this component's own JSX root IS the
 * `<button>` (no menu-trigger/tooltip engine rendering a DIFFERENT element around it), the exact
 * same arrangement `MatButton` itself uses. Needed because the dialog auto-focuses its
 * `cdkFocusInitial` button with a plain `.focus()` call, which — confirmed live — leaves it
 * `cdk-focused cdk-program-focused` (MatButton's own, real FocusMonitor-equivalent behavior,
 * independent of the dialog's own focus-trap).
 */
export const PlainButton = component$<PlainButtonProps>(props => {
  const focusOrigin = useFocusOrigin();
  const rippleInitialized = useSignal(false);

  const classes = [
    'mdc-button',
    'mat-mdc-button-base',
    'mat-mdc-button',
    'mat-unthemed',
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
  ].filter(Boolean) as string[];

  // `MatRippleLoader`'s real bootstrap events include `focus`/`mousedown` (confirmed live) —
  // both qualify for this dialog's own interaction (a plain click, and the auto-focus a
  // `cdkFocusInitial` button receives on open).
  const bootstrapRipple$ = $(() => {
    rippleInitialized.value = true;
  });

  return (
    <button
      {...(props.cdkFocusInitial ? ({cdkfocusinitial: ''} as Record<string, string>) : {})}
      type={props.type}
      class={classes}
      mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
      mat-ripple-loader-class-name="mat-mdc-button-ripple"
      onClick$={props.onClick$}
      onFocus$={bootstrapRipple$}
      onMouseDown$={bootstrapRipple$}
    >
      <span class="mat-mdc-button-persistent-ripple mdc-button__ripple" />
      <span class="mdc-button__label">
        <Slot />
      </span>
      <span class="mat-focus-indicator" />
      <span class="mat-mdc-button-touch-target" />
      {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
    </button>
  );
});
