import {createDefaultHeaderText} from '@angular-community/qwik-cdk/table';
import type {MatColumnDef} from './mat-table-types';

/**
 * Builds a `MatColumnDef` equivalent to upstream's `<mat-text-column
 * [name]="...">` (src/material/table/text-column.ts / src/cdk/table/text-column.ts).
 *
 * Unlike upstream, this does NOT read `data[name]` itself at render time —
 * per this port's data-driven row shape (see mat-table-types.ts), per-row
 * cell VALUES already live in the consumer's own `rows[i].cells`, computed
 * the same trivial way upstream's default `dataAccessor` would
 * (`row[name]`). `matTextColumn()` only contributes what upstream's
 * `<mat-text-column>` element itself would otherwise be the SOLE source of:
 * the auto-capitalized header text default and the `justify` ->
 * `text-align` styling applied to both header and data/footer cells.
 * `<mat-text-column>` itself never appears in the rendered DOM upstream
 * (its content is unprojected and simply never inserted — confirmed live,
 * see angular-parity.spec.ts's header comment point 8), so a Qwik
 * `<mat-text-column>` element would be equally pointless to render; this
 * helper produces a plain data object instead.
 */
export function matTextColumn(
  name: string,
  opts?: {header?: string; justify?: 'start' | 'end' | 'center'; footer?: string},
): MatColumnDef {
  return {
    name,
    header: opts?.header ?? createDefaultHeaderText(name),
    footer: opts?.footer,
    justify: opts?.justify ?? 'start',
  };
}
