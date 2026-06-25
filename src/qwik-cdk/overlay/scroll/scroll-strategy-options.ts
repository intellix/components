/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createContextId, useContext} from '@builder.io/qwik';
import {NoopScrollStrategy} from './noop-scroll-strategy';
import {BlockScrollStrategy} from './block-scroll-strategy';
import {CloseScrollStrategy} from './close-scroll-strategy';
import type {CloseScrollStrategyConfig} from './close-scroll-strategy';
import {RepositionScrollStrategy} from './reposition-scroll-strategy';
import type {RepositionScrollStrategyConfig} from './reposition-scroll-strategy';

/**
 * Options for how an overlay will handle scrolling.
 *
 * This class acts as a factory for ScrollStrategy instances.
 */
export class ScrollStrategyOptions {
  /** Do nothing on scroll. */
  noop = () => new NoopScrollStrategy();

  /** Block scrolling. */
  block = () => new BlockScrollStrategy();

  /**
   * Close the overlay as soon as the user scrolls.
   * @param config Configuration to be used inside the scroll strategy.
   */
  close = (config?: CloseScrollStrategyConfig) => new CloseScrollStrategy(config);

  /**
   * Update the overlay's position on scroll.
   * @param config Configuration to be used inside the scroll strategy.
   */
  reposition = (config?: RepositionScrollStrategyConfig) => new RepositionScrollStrategy(config);
}

export const SCROLL_STRATEGY_OPTIONS = createContextId<ScrollStrategyOptions>(
  'qwik-cdk/scroll-strategy-options',
);

export function useScrollStrategyOptions(): ScrollStrategyOptions {
  return useContext(SCROLL_STRATEGY_OPTIONS);
}
