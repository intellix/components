/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  createGlobalPositionStrategy,
  type GlobalPositionStrategy,
} from './global-position-strategy';
import {
  createFlexibleConnectedPositionStrategy,
  type FlexibleConnectedPositionStrategy,
  type FlexibleConnectedPositionStrategyOrigin,
} from './flexible-connected-position-strategy';

/** Builder for overlay position strategy. */
export interface OverlayPositionBuilder {
  /** Creates a global position strategy. */
  global(): GlobalPositionStrategy;
  /**
   * Creates a flexible position strategy.
   * @param origin Origin relative to which to position the overlay.
   */
  flexibleConnectedTo(
    origin: FlexibleConnectedPositionStrategyOrigin,
  ): FlexibleConnectedPositionStrategy;
}

export function createOverlayPositionBuilder(): OverlayPositionBuilder {
  return {
    global() {
      return createGlobalPositionStrategy();
    },
    flexibleConnectedTo(origin) {
      return createFlexibleConnectedPositionStrategy(origin);
    },
  };
}
