import {component$, Slot, useSignal} from '@builder.io/qwik';
import {useFocusTrap} from '../a11y/focus-trap/use-focus-trap';
import type {DialogConfig} from './dialog-config';
// @ts-expect-error - side-effect scss import; bundled by Vite
import './../scss/dialog/dialog-container.scss';

export const CdkDialogContainer = component$<{config: DialogConfig}>(({config}) => {
  const hostRef = useSignal<HTMLElement>();
  useFocusTrap(hostRef, {
    autoFocus: config.autoFocus ?? 'first-tabbable',
    restoreFocus: config.restoreFocus !== false,
  });
  // Note: `panelClass` is NOT echoed here — upstream CdkDialogContainer's host
  // binding has no panelClass class; `panelClass` is applied to the overlay
  // *pane* only (see OverlayHost), which this container's root sits inside.
  return (
    <cdk-dialog-container
      ref={hostRef}
      class="cdk-dialog-container"
      tabIndex={-1}
      id={config.id ?? undefined}
      role={config.role ?? 'dialog'}
      aria-modal={config.ariaModal ?? false}
      aria-label={config.ariaLabel ?? undefined}
      aria-labelledby={config.ariaLabel ? undefined : (config.ariaLabelledBy ?? undefined)}
      aria-describedby={config.ariaDescribedBy ?? undefined}
    >
      <Slot />
    </cdk-dialog-container>
  );
});
