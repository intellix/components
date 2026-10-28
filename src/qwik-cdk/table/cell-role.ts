/**
 * Pure port of `CdkTable._getCellRole()` (src/cdk/table/table.ts). Header
 * cells always get a static `columnheader` role (handled by the component
 * itself, not this function); data/footer cells resolve their role from the
 * table's OWN role attribute: `gridcell` if the table is `grid`/`treegrid`,
 * else `cell` (upstream sets `role="cell"` even on a native `<td>`, which
 * already has an implicit cell role, "because some browsers seem to require
 * it" — see the upstream comment).
 */
export function getCellRole(tableRole: string | null | undefined): 'cell' | 'gridcell' {
  return tableRole === 'grid' || tableRole === 'treegrid' ? 'gridcell' : 'cell';
}
