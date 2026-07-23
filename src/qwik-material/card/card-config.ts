import {createContextId} from '@builder.io/qwik';
import type {MatCardAppearance} from './card-appearance';

/**
 * Object that can be used to configure default options for every MatCard
 * rendered inside a <QwikMaterialProvider matCardConfig={…}> subtree.
 *
 * See design spec §2.1 and §2.3 for full field semantics.
 */
export interface MatCardConfig {
  /** Default appearance for cards. Defaults to 'raised' when unset. */
  appearance?: MatCardAppearance;
}

/**
 * Context token that installs default MatCard options in a subtree.
 * Provided by <QwikMaterialProvider matCardConfig={…}>. Consumed by
 * MatCard via `useContext(MAT_CARD_CONFIG, DEFAULTS)`.
 */
export const MAT_CARD_CONFIG = createContextId<MatCardConfig>('qwik-material/card-config');
