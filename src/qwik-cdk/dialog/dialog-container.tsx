import {component$, Slot, useSignal} from '@builder.io/qwik';
import {useFocusTrap} from '../a11y/focus-trap/use-focus-trap';
import type {DialogConfig} from './dialog-config';
// @ts-expect-error - side-effect scss import; bundled by Vite
import './../scss/dialog/dialog-container.scss';

function toArray<T>(v: T | T[] | undefined | null): T[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}

export const CdkDialogContainer = component$<{config: DialogConfig}>(({config}) => {
  const hostRef = useSignal<HTMLElement>();
  useFocusTrap(hostRef, {
    autoCapture: config.autoFocus !== false,
  });
  return (
    <div
      ref={hostRef}
      class={['cdk-dialog-container', ...toArray(config.panelClass)].join(' ')}
      tabIndex={-1}
      role={config.role ?? 'dialog'}
      aria-modal={config.ariaModal ?? true}
      aria-label={config.ariaLabel ?? undefined}
      aria-labelledby={config.ariaLabelledBy ?? undefined}
      aria-describedby={config.ariaDescribedBy ?? undefined}
    >
      <Slot />
    </div>
  );
});
