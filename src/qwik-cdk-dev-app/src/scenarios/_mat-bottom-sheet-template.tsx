import {$, component$, useContext} from '@qwik.dev/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MAT_BOTTOM_SHEET_REF,
  useMatBottomSheet,
} from '@angular-community/qwik-material/bottom-sheet';
import {MatNavList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

/**
 * Content-component host tags mirroring src/dev-app/qwik-parity/bottom-sheet.ts's explicit
 * `selector`s — every content component there declares one (unlike dialog.ts's bodies, which
 * fall back to `<ng-component>`), which becomes its real DOM host tag once Angular's
 * `ComponentPortal` instantiates it. See bottom-sheet.ts's header comment and
 * intrinsic-elements.d.ts (this file's custom tags are declared there).
 */

/** Mirrors BottomSheetScenarioBody. */
export const BottomSheetScenarioBody = component$(() => (
  <bottom-sheet-scenario-body>
    <div class="mat-scenario-body">Material scenario body</div>
  </bottom-sheet-scenario-body>
));

/**
 * Mirrors BottomSheetNavBody — the real demo's content
 * (src/dev-app/bottom-sheet/bottom-sheet-demo.ts), using already-ported `MatNavList`/
 * `MatListItemTitle` (see src/qwik-cdk-dev-app/src/routes/mat-list/nav/index.tsx for the
 * identical `title={<MatListItemTitle>...}` convention). Each action dismisses the sheet via
 * the injected MAT_BOTTOM_SHEET_REF context, exactly like the real demo's `ExampleBottomSheet`.
 */
export const BottomSheetNavBody = component$(() => {
  const ref = useContext(MAT_BOTTOM_SHEET_REF);
  const onActionClick$ = $((event: MouseEvent) => {
    event.preventDefault();
    ref?.dismiss();
  });
  return (
    <bottom-sheet-nav-body>
      <MatNavList>
        <MatListItem
          as="a"
          href="#"
          onClick$={onActionClick$}
          title={<MatListItemTitle>Action 1</MatListItemTitle>}
        />
        <MatListItem
          as="a"
          href="#"
          onClick$={onActionClick$}
          title={<MatListItemTitle>Action 2</MatListItemTitle>}
        />
        <MatListItem
          as="a"
          href="#"
          onClick$={onActionClick$}
          title={<MatListItemTitle>Action 3</MatListItemTitle>}
        />
      </MatNavList>
    </bottom-sheet-nav-body>
  );
});

/** Mirrors BottomSheetFocusableBody — has a heading (for `autoFocus: 'first-heading'`) and other focusable content. */
export const BottomSheetFocusableBody = component$(() => (
  <bottom-sheet-focusable-body>
    <h2>Heading</h2>
    <p>Content</p>
    <button class="first-button">First</button>
  </bottom-sheet-focusable-body>
));

/** Mirrors BottomSheetDataBody — renders injected MAT_BOTTOM_SHEET_DATA and dismisses with a result derived from it. */
export const BottomSheetDataBody = component$(() => {
  const data = useContext(MAT_BOTTOM_SHEET_DATA) as {message: string};
  const ref = useContext(MAT_BOTTOM_SHEET_REF);
  const onClose$ = $(() => {
    ref?.dismiss(data.message);
  });
  return (
    <bottom-sheet-data-body>
      <div class="mat-scenario-body">{data.message}</div>
      <button class="data-close" onClick$={onClose$}>
        Close
      </button>
    </bottom-sheet-data-body>
  );
});

/** Mirrors BottomSheetSecondBody. */
export const BottomSheetSecondBody = component$(() => (
  <bottom-sheet-second-body>
    <div class="mat-scenario-body">Second sheet</div>
  </bottom-sheet-second-body>
));

/**
 * Mirrors BottomSheetFirstBody — opens the second sheet from a button INSIDE the first sheet's
 * own content (see bottom-sheet.ts's header comment for why: the page's own triggers sit behind
 * `hasBackdrop: true`'s backdrop once the first sheet is open).
 */
export const BottomSheetFirstBody = component$(() => {
  const bottomSheet = useMatBottomSheet();
  const onOpenSecond$ = $(async () => {
    await bottomSheet.open$(BottomSheetSecondBody, {hasBackdrop: true});
  });
  return (
    <bottom-sheet-first-body>
      <div class="mat-scenario-body">First sheet</div>
      <button class="open-second" onClick$={onOpenSecond$}>
        Open second
      </button>
    </bottom-sheet-first-body>
  );
});
