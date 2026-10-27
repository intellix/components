import {component$, useSignal} from '@builder.io/qwik';
import {
  MatButtonToggleGroup,
  MatButtonToggle,
} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  const style = useSignal<string | undefined>('bold');

  return (
    <>
      <div data-parity-root>
        <form>
          <MatButtonToggleGroup
            name="text-style"
            value={style.value}
            onChange$={(v: unknown) => {
              style.value = v as string | undefined;
            }}
            aria-label="Text style (form-name)"
          >
            <MatButtonToggle value="bold">Bold</MatButtonToggle>
            <MatButtonToggle value="italic">Italic</MatButtonToggle>
            <MatButtonToggle value="underline">Underline</MatButtonToggle>
          </MatButtonToggleGroup>
        </form>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
