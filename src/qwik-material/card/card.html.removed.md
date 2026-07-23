# card.html — removed

Upstream `src/material/card/card.html` is inlined into `mat-card.tsx` as
JSX per the qwik-material file-naming rule. Upstream template is:

    <ng-content></ng-content>

Single default projection slot. qwik-material renders `<mat-card>` with
a single `<Slot />` for children — no structured slots.
