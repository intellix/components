/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {isBrowser} from '@qwik.dev/core/build';

export function getViewportSize(): {width: number; height: number} {
  if (!isBrowser) return {width: 0, height: 0};
  return {width: window.innerWidth, height: window.innerHeight};
}

export function getViewportScrollPosition(): {top: number; left: number} {
  if (!isBrowser) return {top: 0, left: 0};
  return {top: window.pageYOffset, left: window.pageXOffset};
}
