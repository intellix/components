import {component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';
import {NativeSelectControl} from '../_lib/native-select-control';

/**
 * Port of material.angular.dev's `select-form` docs example
 * (src/components-examples/material/select/select-form/) — a `<mat-select name="food"
 * [(ngModel)]="selectedValue">` and a `<select matNativeControl name="car" [(ngModel)]=
 * "selectedCar">`, both inside one `<form>`. Qwik has no `NgForm`/`ngModel` — the `<form
 * novalidate class="ng-untouched ng-pristine ng-valid">` wrapper and both controls'
 * `ng-untouched ng-pristine ng-valid` classes are the FIXED result Angular's forms directives
 * produce for this exact, never-submitted/touched/dirty scenario (no validators, so always
 * valid) — hardcoded here the same way every other "no forms system" deviation in this port
 * renders its one fixed resulting DOM state (see e.g. `qwik-material/input/SYNC.md` #1) rather
 * than reimplementing `NgForm`. `selectedCar` starts `''` upstream (component field default), so
 * the native select's first, empty, explicitly-`selected` option is genuinely selected — unlike
 * `select-overview`'s native card (no ngModel, no explicit "selected").
 */
export default component$(() => {
  const selectedValue = useSignal<string | undefined>(undefined);
  const selectedCar = useSignal('');

  const foods = [
    {value: 'steak-0', label: 'Steak'},
    {value: 'pizza-1', label: 'Pizza'},
    {value: 'tacos-2', label: 'Tacos'},
  ];
  const cars = [
    {value: 'volvo', label: 'Volvo'},
    {value: 'saab', label: 'Saab'},
    {value: 'mercedes', label: 'Mercedes'},
  ];

  return (
    <select-form-example>
      <form class="ng-untouched ng-pristine ng-valid" noValidate>
        <h4>mat-select</h4>
        <MatFormField
          label={<MatLabel>Favorite food</MatLabel>}
          touched={false}
          dirty={false}
          invalid={false}
          control={
            <MatSelect
              controlType="mat-select"
              formBound
              touched={false}
              dirty={false}
              invalid={false}
              value={selectedValue.value}
              onValueChange$={v => (selectedValue.value = v as string | undefined)}
              options={foods}
            />
          }
        />
        <p> Selected food: {selectedValue.value} </p>
        <h4>native html select</h4>
        <MatFormField
          label={<MatLabel>Favorite car</MatLabel>}
          touched={false}
          dirty={false}
          invalid={false}
          control={
            <NativeSelectControl
              controlType="mat-native-select"
              name="car"
              formBound
              touched={false}
              dirty={false}
              invalid={false}
              value={selectedCar.value}
              onChange$={(_, el) => (selectedCar.value = el.value)}
            >
              <option value="" selected></option>
              {cars.map(c => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </NativeSelectControl>
          }
        />
        <p> Selected car: {selectedCar.value} </p>
      </form>
    </select-form-example>
  );
});
