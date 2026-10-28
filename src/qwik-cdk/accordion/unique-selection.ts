/**
 * Pure predicate mirroring the callback `CdkAccordionItem` registers with the
 * `UniqueSelectionDispatcher` in `ngOnInit`
 * (`src/cdk/accordion/accordion-item.ts`):
 *
 * ```ts
 * this._removeUniqueSelectionListener = this._expansionDispatcher.listen((id, accordionId) => {
 *   if (this.accordion && !this.accordion.multi && this.accordion.id === accordionId && this.id !== id) {
 *     this.expanded = false;
 *   }
 * });
 * ```
 *
 * Framed as a standalone function (no RxJS `Subject` / listener array
 * needed) because every consumer in this port only ever reaches a broadcast
 * through `CDK_ACCORDION_STATE` context, which is already scoped to exactly
 * one accordion instance's subtree — there is no cross-accordion id to
 * compare, so the "same accordion" half of upstream's condition
 * (`this.accordion.id === accordionId`) is true by construction. Kept
 * separate from the Qwik hooks in `use-cdk-accordion-item.ts` so the
 * decision logic is trivially unit-testable without rendering anything.
 */
export function shouldAutoClose(params: {
  /** Whether the broadcasting accordion allows multiple expanded items. */
  multi: boolean;
  /** This item's own id. */
  selfId: string;
  /** The id of the item the broadcast says just opened. */
  openedId: string;
  /** Whether THIS item currently believes it is expanded. */
  currentlyExpanded: boolean;
}): boolean {
  const {multi, selfId, openedId, currentlyExpanded} = params;
  if (multi) return false;
  if (openedId === selfId) return false;
  return currentlyExpanded;
}
