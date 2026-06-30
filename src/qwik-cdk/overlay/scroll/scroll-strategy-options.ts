/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createContextId, useContext} from '@builder.io/qwik';
import type {ScrollStrategy} from './scroll-strategy';
import {createNoopScrollStrategy} from './noop-scroll-strategy';
import {createBlockScrollStrategy} from './block-scroll-strategy';
import {createCloseScrollStrategy, type CloseScrollStrategyConfig} from './close-scroll-strategy';
import {
  createRepositionScrollStrategy,
  type RepositionScrollStrategyConfig,
} from './reposition-scroll-strategy';

/**
 * Options for how an overlay will handle scrolling.
 *
 * This bag of factory functions is provided via context by `<QwikCdkRoot>`
 * so consumers can pick a scroll strategy without importing each individual
 * factory.
 */
export interface ScrollStrategyOptions {
  /** Do nothing on scroll. */
  noop(): ScrollStrategy;
  /** Block scrolling. */
  block(): ScrollStrategy;
  /** Close the overlay as soon as the user scrolls. */
  close(config?: CloseScrollStrategyConfig): ScrollStrategy;
  /** Update the overlay's position on scroll. */
  reposition(config?: RepositionScrollStrategyConfig): ScrollStrategy;
}

export function createScrollStrategyOptions(): ScrollStrategyOptions {
  return {
    noop: () => createNoopScrollStrategy(),
    block: () => createBlockScrollStrategy(),
    close: config => createCloseScrollStrategy(config),
    reposition: config => createRepositionScrollStrategy(config),
  };
}

export const SCROLL_STRATEGY_OPTIONS = createContextId<ScrollStrategyOptions>(
  'qwik-cdk/scroll-strategy-options',
);

export function useScrollStrategyOptions(): ScrollStrategyOptions {
  return useContext(SCROLL_STRATEGY_OPTIONS);
}
