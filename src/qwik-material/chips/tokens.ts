import {createContextId} from '@qwik.dev/core';

/** A separator key with required modifiers — mirrors upstream's `SeparatorKey`. */
export interface SeparatorKey {
  key: string;
  modifiers?: readonly ('alt' | 'control' | 'meta' | 'shift')[];
}

/**
 * Qwik-port equivalent of upstream's `MAT_CHIPS_DEFAULT_OPTIONS` injection
 * token (`src/material/chips/tokens.ts`). Consumers provide this via
 * `<QwikMaterialProvider matChipsConfig={...}>`.
 */
export interface MatChipsConfig {
  /**
   * Keys that trigger `onTokenEnd$` on a chip-grid's input. Upstream's keycode-based
   * `SeparatorKey`/number shape is replaced by plain `KeyboardEvent.key` strings (`'Enter'`,
   * `','`, …) — this port has no keycode table to mirror, and `event.key` is the modern,
   * non-deprecated equivalent. Defaults to `['Enter']`, matching upstream's `[ENTER]`.
   */
  separatorKeys?: readonly (string | SeparatorKey)[];
  /** Whether single-selection checkmark indicators are hidden by default on every
   *  MatChipListbox that doesn't set its own `hideSingleSelectionIndicator`. */
  hideSingleSelectionIndicator?: boolean;
  /** Whether a chip-grid's input stays interactive while disabled, by default. */
  inputDisabledInteractive?: boolean;
}

export const MAT_CHIPS_CONFIG_DEFAULTS: MatChipsConfig = {
  separatorKeys: ['Enter'],
  hideSingleSelectionIndicator: false,
  inputDisabledInteractive: false,
};

/**
 * Context id used by MatChipListbox / MatChipInput (via MatChipGrid) to read config.
 * Provided by `<QwikMaterialProvider matChipsConfig={...}>`.
 */
export const MAT_CHIPS_CONFIG = createContextId<MatChipsConfig>('qwik-material/chips-config');
