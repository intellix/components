/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {ContextId} from '@builder.io/qwik';

/**
 * Describes a Qwik context value that should be provided inside an overlay's
 * component tree, allowing the overlay's content to override context values
 * from the document root.
 */
export interface OverlayContextOverride<T = unknown> {
  ctx: ContextId<T>;
  value: T;
}
