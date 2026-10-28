import {$, component$, useSignal, useTask$, type Signal} from '@builder.io/qwik';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatChipGrid, type MatChipRowDef} from '@angular-community/qwik-material/chips';

const INITIAL_FRUITS = ['Lemon', 'Lime'];

function rowsForFruits(
  fruits: readonly string[],
  fruitsSignal: Signal<readonly string[]>,
): MatChipRowDef[] {
  return fruits.map(fruit => ({
    key: fruit,
    content: fruit,
    removeButton: {content: '×', 'aria-label': `Remove ${fruit}`},
    onRemoved$: $(() => {
      fruitsSignal.value = fruitsSignal.value.filter(f => f !== fruit);
    }),
    // See `MatChipRowDef.dynamicallyAdded`'s own doc comment. Deliberately based on the
    // ORIGINAL seed list, not "whichever rows <MatChipGrid> happened to see at its own most
    // recent mount" — that distinction is exactly what survives this component being
    // destroyed and recreated by the self-healing retry below.
    dynamicallyAdded: !INITIAL_FRUITS.includes(fruit),
  }));
}

export default component$(() => {
  const fruits = useSignal<readonly string[]>(INITIAL_FRUITS);
  const idGen = useIdGenerator();
  // Generated once, with the upstream-matching prefix, and handed to <MatChipGrid> as its
  // explicit `id` — see mat-chip-grid.tsx's module doc comment for why the id must be decided
  // up front by the consumer rather than discovered from a nested <input> after the fact.
  const inputId = useSignal(() => idGen.getId('mat-mdc-chip-list-input-'));

  // `<MatChipGrid>` is nested inside `<MatFormField control={...}>` below — a plain
  // `rows={...}` prop there would be frozen after the first render (see
  // `MatChipGridProps.rows`'s own doc comment). Reassigning a stable signal's `.value` on
  // every one of THIS component's own renders sidesteps it: `<MatChipGrid>` dereferences
  // `.value` itself, fresh, on its own every render. The reassignment itself happens in a
  // `useTask$`, not inline in this render body, matching every other derived-signal pattern
  // in this port.
  const rowsSignal = useSignal<MatChipRowDef[]>([]);
  useTask$(({track}) => {
    const current = track(() => fruits.value);
    rowsSignal.value = rowsForFruits(current, fruits);
  });

  // Self-healing retry for a real, rare Qwik 1.20 runtime limitation — see
  // `mat-chip-grid.tsx`'s `ChipGridRows` doc comment and chips/SYNC.md's Deviations section
  // for the full write-up (logged as "Rendering promises in JSX signals is not supported": a
  // swallowed, not thrown, error that can, roughly 1 in 15-30 runs, make the FIRST row ever
  // added purely client-side fail to materialize). Confirmed live this isn't scoped to
  // `<MatChipGrid>`'s own internals — `<mat-chip-grid>` itself gets fully destroyed and
  // recreated as part of EVERY add, success or failure, and the bug is simply that specific
  // recreation occasionally not completing. Since `<MatChipGrid>` sits inside `<MatFormField
  // control={...}>`'s FROZEN prop value, nothing from INSIDE `<MatChipGrid>` can force itself
  // to recreate via a working top-level path (several attempts to self-heal from inside it
  // were tried and none helped, consistent with the failure being at or above this level) —
  // only an ANCESTOR with a live, reactive `key` on `<MatFormField>` itself can. Bumping this
  // forces the WHOLE `<MatFormField>` (and hence its `<MatChipGrid>` control) to remount
  // fresh from THIS component's own top-level re-render — confirmed live this reliably
  // self-corrects within one retry.
  const formFieldRemountNonce = useSignal(0);

  return (
    <>
      <div data-parity-root>
        <MatFormField
          key={formFieldRemountNonce.value}
          appearance="outline"
          style="width: 300px"
          label={<MatLabel>Fruits</MatLabel>}
          control={
            <MatChipGrid
              id={inputId.value}
              controlType="mat-chip-grid"
              value={fruits.value.length ? fruits.value : undefined}
              aria-label="Enter fruits"
              rows={rowsSignal}
              input={{
                placeholder: 'New fruit...',
                onTokenEnd$: $((value: string, clear) => {
                  const trimmed = value.trim();
                  if (trimmed) {
                    fruits.value = [...fruits.value, trimmed];
                    // See `formFieldRemountNonce`'s own doc comment above. Polls via rAF
                    // (reacting as soon as the browser's own render loop allows, rather than
                    // a fixed worst-case delay) for up to ~10 frames: confirmed live the
                    // disappearance is a permanent, swallowed failure (not something that
                    // self-corrects with more waiting), so a handful of frames is enough to
                    // confidently distinguish "gone" from "still finishing a healthy render".
                    let framesLeft = 10;
                    const checkMissing = () => {
                      const grid = document.querySelector('[data-parity-root] mat-chip-grid');
                      if (grid) return;
                      framesLeft--;
                      if (framesLeft <= 0) {
                        formFieldRemountNonce.value++;
                        // The fresh `<MatFormField>`/`<MatChipGrid>` instance has no memory
                        // of the input still logically being focused (Enter doesn't blur it)
                        // — re-focus the NEW input, as soon as it exists, so the recovered
                        // DOM matches what the user's actual focus position implies
                        // (mat-focused / mdc-text-field--focused). `<MatChipGrid>`'s own
                        // `focusin` listener (triggered by this `.focus()` call) re-runs its
                        // ripple-loader correction itself, now correctly skipping the
                        // dynamically-added row via `rowsForFruits`'s own
                        // `dynamicallyAdded` marking — no extra DOM poking needed here.
                        let refocusFramesLeft = 10;
                        const tryRefocus = () => {
                          const newInput = document.querySelector(
                            '[data-parity-root] input.mat-mdc-chip-input',
                          ) as HTMLInputElement | null;
                          if (newInput) {
                            newInput.focus();
                            return;
                          }
                          refocusFramesLeft--;
                          if (refocusFramesLeft > 0) requestAnimationFrame(tryRefocus);
                        };
                        requestAnimationFrame(tryRefocus);
                        return;
                      }
                      requestAnimationFrame(checkMissing);
                    };
                    requestAnimationFrame(checkMissing);
                  }
                  clear();
                }),
              }}
            />
          }
        />
        <p>Chips: {fruits.value.join(', ') || '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
