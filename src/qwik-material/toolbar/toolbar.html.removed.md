# toolbar.html — removed

Upstream `src/material/toolbar/toolbar.html` is inlined into
`mat-toolbar.tsx` as JSX per the qwik-material file-naming rule. Upstream
template is two adjacent projections:

    <ng-content></ng-content>
    <ng-content select="mat-toolbar-row"></ng-content>

Angular's `<ng-content select>` picks projected children by selector match.
Qwik has no equivalent, but the ordering here is a no-op: Angular projects
free content into the unnamed slot AND `<mat-toolbar-row>` children into
the selected slot — both rendered in source order. In Qwik we use a single
unnamed `<Slot />` and let the consumer place `<MatToolbarRow>` children
directly inside `<MatToolbar>`; ordering is preserved automatically.
Consumers using multi-row layout MUST set `multipleRows` on the toolbar
so the correct `mat-toolbar-multiple-rows` / `mat-toolbar-single-row`
class is applied (upstream detects this at runtime via @ContentChildren;
Qwik has no equivalent).
