# Sync log: coercion
Last synced from angular/components commit: 7ef5967ff21070a1dfdb044132e7a3ee175688a1
Synced files:
- boolean-property.ts (verbatim)
- number-property.ts (verbatim)
- array.ts (verbatim)
- string-array.ts (verbatim)
- css-pixel-value.ts (verbatim)
- element.ts (modified: inline ElementRef interface instead of @angular/core import)
- public-api.ts (verbatim)

Intentionally not ported: none.
Open deviations:
- element.ts uses a local ElementRef interface ({ nativeElement: HTMLElement })
  to avoid an @angular/core dependency. Consumers passing a raw HTMLElement
  still work.
