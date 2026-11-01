import {component$, type Signal} from '@qwik.dev/core';
import {MatOption} from '../core/mat-option';
import type {DateAdapter} from '../core/datetime/date-adapter';
import {DEFAULT_DATE_ADAPTER} from '../core/datetime/native-date-adapter';
import type {MatTimepickerRenderOption} from './use-mat-timepicker';

const adapter = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;

/**
 * The content `MatTimepicker` attaches to its overlay — the literal `.mat-timepicker-panel`
 * listbox div (`timepicker.html`'s `<ng-template>` content). Rendered by `qwik-cdk/overlay`'s
 * `OverlayHost` as the sole child of `.cdk-overlay-pane`.
 *
 * Created once per `open()` session (see `timepicker-runtime.ts`'s `openTimepickerPanel` — same
 * "fresh overlay per open" simplification `qwik-material/select`/`tooltip` already establish).
 * `options`/`value`/`activeIndex`/`exiting` are passed as the ACTUAL `Signal` objects the shared
 * `MatTimepickerHandle` owns (never `.value`) — this is what keeps this component's own renders
 * live across the whole open session despite living in a completely separate component tree
 * from `MatTimepickerInput`/`MatTimepickerToggle`; see `mat-select-panel.tsx`'s own doc comment
 * for the same, already-proven pattern. `onOptionSelect` is a plain (non-`$()`) callback — safe
 * here because the whole overlay subsystem is created and consumed client-side, within the same
 * execution context, never crossing an SSR→resume boundary.
 *
 * Props are deliberately NOT generic over `D` — same reason `MatSelectPanelProps.value` is a
 * plain `Signal<unknown>` rather than `Signal<T>` — `Component<P>`'s own type (`qwik-cdk/overlay`'s
 * `Overlay.create<P>`) doesn't need to preserve the caller's `D`, and a generic `component$`
 * fights the Qwik optimizer's static analysis. `timepicker-runtime.ts` casts through `unknown`
 * at the one call site that constructs these props.
 */
export interface MatTimepickerPanelProps {
  id: string;
  options: Signal<readonly MatTimepickerRenderOption<unknown>[]>;
  value: Signal<unknown>;
  activeIndex: Signal<number>;
  exiting: Signal<boolean>;
  ariaLabel: string | undefined;
  ariaLabelledby: string | undefined;
  animationsDisabled: boolean;
  panelRef: Signal<Element | undefined>;
  onOptionSelect: (option: MatTimepickerRenderOption<unknown>) => void;
}

export const MatTimepickerPanel = component$<MatTimepickerPanelProps>(props => {
  const classes = [
    'mat-timepicker-panel',
    !props.animationsDisabled && 'mat-timepicker-panel-animations-enabled',
    props.exiting.value && 'mat-timepicker-panel-exit',
  ].filter(Boolean) as string[];

  return (
    <div
      ref={props.panelRef}
      role="listbox"
      id={props.id}
      class={classes}
      aria-label={props.ariaLabel || undefined}
      aria-labelledby={props.ariaLabelledby || undefined}
    >
      {props.options.value.map((option, index) => (
        <MatOption
          key={option.id}
          id={option.id}
          value={option.value}
          // Upstream's `[value]="option.value"` is a property binding, never a DOM attribute —
          // see `MatOptionProps.echoValueAttr`'s own doc comment.
          echoValueAttr={false}
          selected={props.value.value != null && adapter.sameTime(option.value, props.value.value)}
          active={props.activeIndex.value === index}
          onSelectInteraction$={() => props.onOptionSelect(option)}
        >
          {option.label}
        </MatOption>
      ))}
    </div>
  );
});
