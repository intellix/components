import {component$, useSignal} from '@builder.io/qwik';
import {
  MatButtonToggleGroup,
  MatButtonToggle,
} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  const style = useSignal<'bold' | 'italic' | 'underline' | undefined>(undefined);

  return (
    <>
      <div data-parity-root>
        <MatButtonToggleGroup
          value={style.value}
          onChange$={(v: unknown) => {
            style.value = v as 'bold' | 'italic' | 'underline' | undefined;
          }}
          aria-label="Text style"
        >
          <MatButtonToggle value="bold">Bold</MatButtonToggle>
          <MatButtonToggle value="italic">Italic</MatButtonToggle>
          <MatButtonToggle value="underline">Underline</MatButtonToggle>
        </MatButtonToggleGroup>
        <p>Selected: {style.value ?? '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
