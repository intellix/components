import {$, component$, useSignal} from '@builder.io/qwik';
import {MatSlider} from '@angular-community/qwik-material/slider';

// Mirrors src/dev-app/qwik-parity/slider.ts's SliderColors.
export default component$(() => {
  const valueDefault = useSignal(50);
  const valuePrimary = useSignal(50);
  const onValueDefaultChange$ = $((v: number) => {
    valueDefault.value = v;
  });
  const onValuePrimaryChange$ = $((v: number) => {
    valuePrimary.value = v;
  });
  return (
    <>
      <div data-parity-root>
        <MatSlider
          style="width: 150px"
          value={valueDefault.value}
          onValueChange$={onValueDefaultChange$}
        />
        <MatSlider
          style="width: 150px"
          color="primary"
          value={valuePrimary.value}
          onValueChange$={onValuePrimaryChange$}
        />
        <MatSlider style="width: 150px" color="accent" value={50} />
        <MatSlider style="width: 150px" color="warn" value={50} />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
