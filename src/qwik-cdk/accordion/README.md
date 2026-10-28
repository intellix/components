# @angular-community/qwik-cdk/accordion

Qwik port of [@angular/cdk/accordion](https://github.com/angular/components/tree/main/src/cdk/accordion).

Exports `useCdkAccordion()` (port of `CdkAccordion`: `multi`, `openAll$`/`closeAll$`) and
`useCdkAccordionItem()` (port of `CdkAccordionItem`: `id`, `setExpanded$`), plus the
`CDK_ACCORDION_STATE` context they share. Both are hooks, not components — like upstream's
directives, they carry no DOM/template of their own; `qwik-material/expansion`'s
`MatAccordion`/`MatExpansionPanel` call them from the components that render the actual host
elements.

The RxJS `UniqueSelectionDispatcher` (`src/cdk/collections/unique-selection-dispatcher.ts`) that
upstream's "only one item expanded at a time" behavior is built on is not ported as a literal
class. Each `useCdkAccordion()` instance instead exposes a plain `Signal` broadcast
(`CdkAccordionState.opened`) that every `useCdkAccordionItem()` descendant reactively tracks —
behaviorally equivalent for this port's purposes, since every listener is already scoped to the
one accordion instance it's nested under (no cross-accordion id to compare), and strictly simpler
than threading a `noSerialize()` listener-array service across the SSR/resume boundary. See
`unique-selection.ts` for the extracted, independently-unit-tested decision predicate, and SYNC.md
for the full rationale.

`CdkAccordion.id` is not ported: it is pure dispatcher-id bookkeeping made unnecessary by the
above, and it is never rendered to the DOM upstream either.
