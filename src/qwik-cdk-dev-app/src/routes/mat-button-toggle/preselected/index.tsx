import {component$, useSignal} from '@builder.io/qwik';
import {
  MatButtonToggleGroup,
  MatButtonToggle,
} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  // Initial signal value = 'italic' → SSR should render italic as checked
  // WITHOUT client-side flash. Playwright verifies via first-paint HTML.
  const style = useSignal<string | undefined>('italic');

  return (
    <>
      <MatButtonToggleGroup
        value={style.value}
        onChange$={(v: unknown) => {
          style.value = v as string | undefined;
        }}
        aria-label="Text style (preselected italic)"
      >
        <MatButtonToggle value="bold">Bold</MatButtonToggle>
        <MatButtonToggle value="italic">Italic</MatButtonToggle>
        <MatButtonToggle value="underline">Underline</MatButtonToggle>
      </MatButtonToggleGroup>
      <main data-scenario-ready>ready</main>
    </>
  );
});
