import {component$, Slot} from '@builder.io/qwik';
import {MatButton, type MatButtonProps} from '../button/mat-button';

/**
 * Qwik port of `src/material/snack-bar/snack-bar-content.ts`'s three
 * attribute directives (`[matSnackBarLabel]`, `[matSnackBarActions]`,
 * `[matSnackBarAction]`). Upstream directives attach to whatever element the
 * consumer writes them on; these are ported as polymorphic components that
 * render that host element themselves (`as`, default `'div'`), matching the
 * pattern `MatListItemAvatar`/`MatListItemIcon` already use — no extra
 * wrapper element either way.
 *
 * The real `matSnackBarLabel`/`matSnackBarActions`/`matSnackBarAction`
 * selector attributes themselves are NOT rendered: like `matFab`/
 * `mat-dialog-close` elsewhere, they're consumer-written directive
 * selectors, not part of the component's own DOM contract (see
 * `CONSUMER_SELECTOR_ATTRS` in `qwik-cdk-parity-tests/lib/material-parity.ts`,
 * which already lists `matsnackbarlabel`/`matsnackbaractions`/
 * `matsnackbaraction`). Only the host classes they contribute matter for
 * parity.
 */
export interface MatSnackBarContentProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
  /** Which host tag to render. Default `'div'`. */
  as?: 'div' | 'span';
}

/** Directive that should be applied to the text element rendered in the snack bar. */
export const MatSnackBarLabel = component$<MatSnackBarContentProps>(props => {
  const classes = ['mat-mdc-snack-bar-label', 'mdc-snackbar__label', props.class].filter(
    Boolean,
  ) as string[];
  if (props.as === 'span') {
    return (
      <span id={props.id} class={classes}>
        <Slot />
      </span>
    );
  }
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});

/** Directive that should be applied to the element containing the snack bar's action buttons. */
export const MatSnackBarActions = component$<MatSnackBarContentProps>(props => {
  const classes = ['mat-mdc-snack-bar-actions', 'mdc-snackbar__actions', props.class].filter(
    Boolean,
  ) as string[];
  if (props.as === 'span') {
    return (
      <span id={props.id} class={classes}>
        <Slot />
      </span>
    );
  }
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});

/**
 * Directive that should be applied to each of the snack bar's action
 * buttons. Unlike `MatSnackBarLabel`/`MatSnackBarActions`, upstream's own
 * usages (`SimpleSnackBar`, the annotated-custom-component example) always
 * pair it with `matButton` on the very same element — ported here as a thin
 * wrapper around `MatButton` that additionally contributes the two
 * `matSnackBarAction` host classes, rather than a bare polymorphic host (no
 * extra wrapper element: `MatButton` already renders the real `<button>`).
 */
export type MatSnackBarActionProps = MatButtonProps;

export const MatSnackBarAction = component$<MatSnackBarActionProps>(props => {
  const classes = ['mat-mdc-snack-bar-action', 'mdc-snackbar__action', props.class].filter(
    Boolean,
  ) as string[];
  return (
    <MatButton {...props} class={classes}>
      <Slot />
    </MatButton>
  );
});
