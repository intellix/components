import {component$, useSignal} from '@builder.io/qwik';
import {
  MatButtonToggleGroup,
  MatButtonToggle,
} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  const perms = useSignal<readonly string[]>([]);

  return (
    <>
      <MatButtonToggleGroup
        multiple
        values={perms.value}
        onValuesChange$={(vs: readonly unknown[]) => {
          perms.value = vs as readonly string[];
        }}
        aria-label="Permissions"
      >
        <MatButtonToggle value="read">Read</MatButtonToggle>
        <MatButtonToggle value="write">Write</MatButtonToggle>
        <MatButtonToggle value="admin">Admin</MatButtonToggle>
      </MatButtonToggleGroup>
      <p>Selected: {perms.value.join(', ') || '(none)'}</p>
      <main data-scenario-ready>ready</main>
    </>
  );
});
