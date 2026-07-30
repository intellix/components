import {$, component$, useSignal, useVisibleTask$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => {
  const value = useSignal(0);
  const fired = useSignal(false);

  useVisibleTask$(() => {
    // Kick the value from 0 to 100 on next tick to trigger a transition.
    queueMicrotask(() => {
      value.value = 100;
    });
  });

  return (
    <>
      <MatProgressBar
        value={value.value}
        onAnimationEnd$={$((v: number) => {
          fired.value = true;
          console.log('animationEnd', v);
        })}
      />
      <div data-animation-end={fired.value ? 'fired' : 'pending'}>
        {fired.value ? 'fired' : 'pending'}
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
