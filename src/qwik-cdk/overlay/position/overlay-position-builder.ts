/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {GlobalPositionStrategy} from './global-position-strategy';
import {
  FlexibleConnectedPositionStrategy,
  type FlexibleConnectedPositionStrategyOrigin,
} from './flexible-connected-position-strategy';

/** Builder for overlay position strategy. */
export class OverlayPositionBuilder {
  /** Creates a global position strategy. */
  global(): GlobalPositionStrategy {
    return new GlobalPositionStrategy();
  }

  /**
   * Creates a flexible position strategy.
   * @param origin Origin relative to which to position the overlay.
   */
  flexibleConnectedTo(
    origin: FlexibleConnectedPositionStrategyOrigin,
  ): FlexibleConnectedPositionStrategy {
    return new FlexibleConnectedPositionStrategy(origin);
  }
}
