# card-title-group.html — removed

Upstream `src/material/card/card-title-group.html` is inlined into
`mat-card-title-group.tsx` as JSX per the qwik-material file-naming rule.
Upstream template:

    <div>
      <ng-content
        select="mat-card-title, mat-card-subtitle,
                [mat-card-title], [mat-card-subtitle],
                [matCardTitle], [matCardSubtitle]"></ng-content>
    </div>
    <ng-content select="[mat-card-image], [matCardImage],
                        [mat-card-sm-image], [matCardImageSmall],
                        [mat-card-md-image], [matCardImageMedium],
                        [mat-card-lg-image], [matCardImageLarge],
                        [mat-card-xl-image], [matCardImageXLarge]"></ng-content>
    <ng-content></ng-content>

Qwik equivalent uses `q:slot="text"` for title/subtitle and `q:slot="image"`
for the image element. The final unnamed slot picks up any free content.
