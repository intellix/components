/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

// Deviation from src/cdk/coercion/element.ts: instead of importing ElementRef from
// @angular/core, we define a local interface to avoid an Angular dependency.
interface ElementRef<T = any> {
  nativeElement: T;
}

/**
 * Coerces an ElementRef or an Element into an element.
 * Useful for APIs that can accept either a ref or the native element itself.
 */
export function coerceElement<T>(elementOrRef: ElementRef<T> | T): T {
  return elementOrRef instanceof Element
    ? (elementOrRef as unknown as T)
    : (elementOrRef as ElementRef<T>).nativeElement;
}
