import {component$, useSignal} from '@builder.io/qwik';
import {
  MatButtonToggleGroup,
  MatButtonToggle,
} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  const style = useSignal<string | undefined>('bold');

  return (
    <>
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
      <main data-scenario-ready>ready</main>
    </>
  );
});
