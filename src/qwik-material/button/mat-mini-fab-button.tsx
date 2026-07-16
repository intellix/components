import {component$, Slot, useContext, $} from '@builder.io/qwik';
import type {MatFabProps} from './mat-fab-button';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import {PersistentRipple} from './internal/persistent-ripple';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';

// Mini-FAB has no 'extended' prop; everything else matches MatFabProps.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MatMiniFabProps extends Omit<MatFabProps, 'extended'> {}

// Same accent default as MatFabButton (see fab.ts line 130-143).
const DEFAULTS: MatButtonConfig = {
  color: 'accent',
  disabledInteractive: false,
  defaultAppearance: 'text',
};

export const MatMiniFabButton = component$<MatMiniFabProps>(props => {
  const config = useContext(MAT_BUTTON_CONFIG, DEFAULTS);
  const color = props.color ?? config.color ?? DEFAULTS.color ?? null;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const isAnchor = props.href != null;
  const nativelyDisabled = !!props.disabled && !disabledInteractive;

  const classes = [
    'mat-mdc-button-base',
    'mdc-fab',
    'mat-mdc-fab-base',
    'mdc-fab--mini',
    'mat-mdc-mini-fab',
    color ? `mat-${color}` : 'mat-unthemed',
    props.disabled && 'mat-mdc-button-disabled',
    disabledInteractive && 'mat-mdc-button-disabled-interactive',
    props.disableRipple && 'mat-mdc-button-ripple-disabled',
    props.class,
  ].filter(Boolean) as string[];

  const preventDisabledClick$ = $((e: MouseEvent) => {
    if (props.disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (props.onClick$) props.onClick$(e);
  });

  const children = (
    <>
      <PersistentRipple isFab={true} />
      <span class="mdc-button__label">
        <Slot />
      </span>
      <FocusIndicator />
      <TouchTarget />
    </>
  );

  if (isAnchor) {
    return (
      <a
        href={props.href}
        id={props.id}
        class={classes}
        tabIndex={nativelyDisabled ? -1 : undefined}
        aria-disabled={props.disabled ? 'true' : undefined}
        aria-label={props.ariaLabel}
        aria-describedby={props.ariaDescribedBy}
        aria-labelledby={props.ariaLabelledBy}
        onClick$={preventDisabledClick$}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      id={props.id}
      class={classes}
      disabled={nativelyDisabled || undefined}
      aria-disabled={props.disabled && disabledInteractive ? 'true' : undefined}
      aria-label={props.ariaLabel}
      aria-describedby={props.ariaDescribedBy}
      aria-labelledby={props.ariaLabelledBy}
      onClick$={props.onClick$}
    >
      {children}
    </button>
  );
});
