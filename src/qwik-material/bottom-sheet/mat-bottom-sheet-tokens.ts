import {createContextId, type NoSerialize} from '@qwik.dev/core';
import type {ScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import type {MatBottomSheetConfig} from './mat-bottom-sheet-config';
import type {MatBottomSheetRef} from './mat-bottom-sheet-ref';

/**
 * Data injected into the bottom sheet's content component. Set by
 * config.data at open() time; the wrapper provides it. Consumers read via
 * `const data = useContext(MAT_BOTTOM_SHEET_DATA) as MyShape;`.
 */
export const MAT_BOTTOM_SHEET_DATA = createContextId<unknown>('qwikMaterial/bottomSheetData');

/**
 * Default options merged into every open() config. Provided by
 * <QwikMaterialProvider matBottomSheetDefaults={…}>. Optional; defaults to {}.
 */
export const MAT_BOTTOM_SHEET_DEFAULT_OPTIONS = createContextId<Partial<MatBottomSheetConfig>>(
  'qwikMaterial/bottomSheetDefaultOptions',
);

/**
 * Factory that returns the default ScrollStrategy for bottom sheets that
 * don't specify one. Provided by
 * <QwikMaterialProvider matBottomSheetScrollStrategyFactory={…}>. Default:
 * createBlockScrollStrategy() from qwik-cdk (matches upstream
 * `MatBottomSheet.open()`'s own default).
 */
export const MAT_BOTTOM_SHEET_SCROLL_STRATEGY = createContextId<NoSerialize<() => ScrollStrategy>>(
  'qwikMaterial/bottomSheetScrollStrategy',
);

/**
 * The MatBottomSheetRef for the currently rendering bottom sheet. Provided by
 * the bottom sheet's internal wrapper; consumed by the content component if
 * it needs to call ref.dismiss() imperatively (mirrors upstream's
 * `inject(MatBottomSheetRef)`).
 */
export const MAT_BOTTOM_SHEET_REF = createContextId<NoSerialize<MatBottomSheetRef>>(
  'qwikMaterial/bottomSheetRef',
);
