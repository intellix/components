import {component$, useSignal} from '@builder.io/qwik';
import {
  MatButtonToggleGroup,
  MatButtonToggle,
} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  const style = useSignal<string | undefined>(undefined);

  return (
    <>
      <MatButtonToggleGroup
        value={style.value}
        onChange$={(v: unknown) => {
          style.value = v as string | undefined;
        }}
        aria-label="Text style (middle disabled)"
      >
        <MatButtonToggle value="bold">Bold</MatButtonToggle>
        <MatButtonToggle value="italic" disabled>
          Italic
        </MatButtonToggle>
        <MatButtonToggle value="underline">Underline</MatButtonToggle>
      </MatButtonToggleGroup>
      <p>Selected: {style.value ?? '(none)'}</p>
      <main data-scenario-ready>ready</main>
    </>
  );
});
