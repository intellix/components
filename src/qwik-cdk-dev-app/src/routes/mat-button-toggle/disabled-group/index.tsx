import {component$, useSignal} from '@qwik.dev/core';
import {
  MatButtonToggleGroup,
  MatButtonToggle,
} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  const style = useSignal<string | undefined>('bold');

  return (
    <>
      <div data-parity-root>
        <MatButtonToggleGroup
          value={style.value}
          disabled
          onChange$={(v: unknown) => {
            style.value = v as string | undefined;
          }}
          aria-label="Text style (disabled group)"
        >
          <MatButtonToggle value="bold">Bold</MatButtonToggle>
          <MatButtonToggle value="italic">Italic</MatButtonToggle>
          <MatButtonToggle value="underline">Underline</MatButtonToggle>
        </MatButtonToggleGroup>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
