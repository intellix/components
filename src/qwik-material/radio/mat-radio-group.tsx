import {$, component$, Slot, useContextProvider, useSignal, type QRL} from '@builder.io/qwik';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import type {MatRadioColor} from './radio-color';
import {MAT_RADIO_GROUP_STATE, type MatRadioGroupState} from './radio-group-state';

/**
 * Props for <MatRadioGroup>. Controlled component — the consumer owns
 * selection state via a signal; the group takes `value` + `onChange$`.
 * Mirrors upstream's `MatRadioGroup` directive
 * (src/material/radio/radio.ts lines 103-373), which attaches to a
 * consumer-written `<mat-radio-group>` host element rather than rendering
 * its own component template — this port renders that host element itself,
 * same as `<MatButtonToggleGroup>` does for the analogous upstream
 * `@Directive` (see button-toggle-group.tsx).
 *
 * Upstream's `change: EventEmitter<MatRadioChange>` has NO `valueChange`
 * counterpart, so there is deliberately no two-way-binding sugar here either
 * — just `value` + `onChange$`, matching the parity spec's explicit note
 * that scenarios wire this with `[value]` + `(change)`, not `[(value)]`.
 */
export interface MatRadioGroupProps {
  /** Selected value for the group. Consumer owns the state. */
  value?: unknown;
  /** Fires when a child's native input becomes checked (click, or native
   *  arrow-key navigation within the shared `name` group). Receives the new
   *  value. */
  onChange$?: QRL<(value: unknown) => void>;
  /** Name shared by every child's native `<input>`. Auto-generated
   *  (`mat-radio-group-N`) when omitted, matching upstream's
   *  `_name = inject(_IdGenerator).getId('mat-radio-group-')` field
   *  initializer. */
  name?: string;
  /** Whether labels appear after or before their radio. Default 'after'. */
  labelPosition?: 'before' | 'after';
  /** Disables every child in the group (OR'd with each child's own). */
  disabled?: boolean;
  /** Marks every child's native input `required` (OR'd with each child's own). */
  required?: boolean;
  /** Whether disabled children stay interactive (OR'd with each child's own). */
  disabledInteractive?: boolean;
  /** Fallback color for children that don't set their own `color`. */
  color?: MatRadioColor;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatRadioGroup = component$<MatRadioGroupProps>(props => {
  const idGen = useIdGenerator();
  // Computed once, lazily — mirrors upstream's `_name = inject(_IdGenerator)
  // .getId(...)` field initializer, which runs once at construction and is
  // only ever overwritten by a later *explicit* `[name]` binding.
  const autoName = useSignal(() => idGen.getId('mat-radio-group-'));
  const name = props.name ?? autoName.value;

  // Rapid clicks on different radios, fired before the onChange$ handler
  // chunk has loaded, can have their *handler invocations* resume out of
  // order even though the native DOM already settled on the last click's
  // target synchronously (browser-native radio-group behavior). Without
  // this guard, an out-of-order-resumed earlier click's handler would push a
  // stale `value` back down through context, forcibly re-checking the wrong
  // radio on the next render. The latest click (by event time) wins, exactly
  // as it would with upstream's synchronous model — same fix shape as
  // button-toggle's `lastSelectedAt` (see its SYNC.md "Rapid clicks while
  // handlers load" section).
  const lastChangedAt = useSignal(-1);
  const consumerOnChange$ = props.onChange$;
  const routeChange$ = $(async (value: unknown, at: number) => {
    await consumerOnChange$?.resolve();
    if (at < lastChangedAt.value) return;
    lastChangedAt.value = at;
    consumerOnChange$?.(value);
  });

  const nextState: MatRadioGroupState = {
    value: props.value,
    name,
    disabled: props.disabled ?? false,
    required: props.required ?? false,
    disabledInteractive: props.disabledInteractive ?? false,
    labelPosition: props.labelPosition === 'before' ? 'before' : 'after',
    color: props.color,
    onChange$: routeChange$,
    standalone: false,
  };
  // Published via a Signal (not a plain object) — see radio-group-state.ts
  // and button-toggle-group-state.ts for why a freshly-built plain object
  // wouldn't notify existing <MatRadioButton> consumers on a later render.
  const stateSignal = useSignal<MatRadioGroupState>(nextState);
  stateSignal.value = nextState;
  useContextProvider(MAT_RADIO_GROUP_STATE, stateSignal);

  // Upstream's `MatRadioGroup` directive host: only `role="radiogroup"` +
  // `class="mat-mdc-radio-group"` (src/material/radio/radio.ts lines
  // 113-116) — no aria-* host bindings at all. A plain `aria-label` written
  // directly on the consumer's `<mat-radio-group>` element (as every parity
  // scenario does) is therefore NOT a declared `@Input` — it passes through
  // untouched, same as any other static attribute on a directive's host
  // element. This port exposes the same three as plain pass-through props.
  return (
    <mat-radio-group
      id={props.id}
      class={['mat-mdc-radio-group', props.class].filter(Boolean) as string[]}
      role="radiogroup"
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-radio-group>
  );
});
