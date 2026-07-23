# card-header.html — removed

Upstream `src/material/card/card-header.html` is inlined into
`mat-card-header.tsx` as JSX per the qwik-material file-naming rule.
Upstream template:

    <ng-content></ng-content>
    <ng-content select="[mat-card-avatar], [matCardAvatar]"></ng-content>
    <div class="mat-mdc-card-header-text">
      <ng-content
        select="mat-card-title, mat-card-subtitle,
                [mat-card-title], [mat-card-subtitle],
                [matCardTitle], [matCardSubtitle]"></ng-content>
    </div>

Angular's `<ng-content select>` picks projected children by SELECTOR match.
Qwik has no equivalent; consumers must use `q:slot="avatar"` on their
MatCardAvatar and `q:slot="text"` on their MatCardTitle / MatCardSubtitle.
Rendered structure preserved:

    <mat-card-header class="mat-mdc-card-header">
      <!-- Default (unnamed) slot for any free-projected content -->
      <!-- q:slot="avatar" slot -->
      <div class="mat-mdc-card-header-text">
        <!-- q:slot="text" slot -->
      </div>
    </mat-card-header>
