import {component$, useSignal} from '@qwik.dev/core';
import {
  MatButtonToggleGroup,
  MatButtonToggle,
} from '@angular-community/qwik-material/button-toggle';

/**
 * Bespoke scenario (no matching upstream docs example) for
 * `hideSingleSelectionIndicator`/`hideMultipleSelectionIndicator` — see
 * `qwik-material/button-toggle/SYNC.md`'s dedicated section. Three groups:
 * a single-mode group with the indicator hidden, a multi-mode group with the
 * indicator hidden, and a single-mode group that sets ONLY
 * `hideMultipleSelectionIndicator` (which must have NO effect — each flag is
 * read only by its own mode, matching upstream's `@if` condition exactly).
 */
export default component$(() => {
  const single = useSignal<string | undefined>(undefined);
  const multi = useSignal<readonly string[]>([]);
  const crossFlag = useSignal<string | undefined>(undefined);

  return (
    <>
      <div data-parity-root>
        <div data-testid="single-hidden">
          <MatButtonToggleGroup
            value={single.value}
            onChange$={(v: unknown) => {
              single.value = v as string | undefined;
            }}
            aria-label="Text style (single, hidden indicator)"
            hideSingleSelectionIndicator
          >
            <MatButtonToggle value="bold">Bold</MatButtonToggle>
            <MatButtonToggle value="italic">Italic</MatButtonToggle>
          </MatButtonToggleGroup>
        </div>
        <div data-testid="multi-hidden">
          <MatButtonToggleGroup
            multiple
            values={multi.value}
            onValuesChange$={(vs: readonly unknown[]) => {
              multi.value = vs as readonly string[];
            }}
            aria-label="Permissions (multi, hidden indicator)"
            hideMultipleSelectionIndicator
          >
            <MatButtonToggle value="read">Read</MatButtonToggle>
            <MatButtonToggle value="write">Write</MatButtonToggle>
          </MatButtonToggleGroup>
        </div>
        <div data-testid="single-cross-flag">
          <MatButtonToggleGroup
            value={crossFlag.value}
            onChange$={(v: unknown) => {
              crossFlag.value = v as string | undefined;
            }}
            aria-label="Text style (single, wrong-mode flag set)"
            hideMultipleSelectionIndicator
          >
            <MatButtonToggle value="bold">Bold</MatButtonToggle>
            <MatButtonToggle value="italic">Italic</MatButtonToggle>
          </MatButtonToggleGroup>
        </div>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
