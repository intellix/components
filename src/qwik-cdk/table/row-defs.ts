/**
 * Pure port of `CdkTable._getRowDefs` (src/cdk/table/table.ts): given a data
 * item + its index, picks which row definition(s) render it.
 *
 * - A single row def is used unconditionally, even if it has its own `when`
 *   predicate (upstream shortcut — confirmed in table.ts: `if
 *   (this._rowDefs.length === 1) return [this._rowDefs[0]];`).
 * - With `multiTemplateDataRows` on, EVERY row def whose `when` predicate
 *   (or absence of one) matches is used — a data item can render as
 *   multiple rows.
 * - Otherwise, the FIRST row def whose `when` matches wins; if none match,
 *   the default row def (the one with no `when` at all) is used.
 */

export interface RowDefLike<T> {
  when?: (index: number, data: T) => boolean;
}

export function getRowDefsForData<T, D extends RowDefLike<T>>(
  data: T,
  dataIndex: number,
  rowDefs: readonly D[],
  multiTemplateDataRows: boolean,
): D[] {
  if (rowDefs.length === 1) {
    return [rowDefs[0]];
  }
  if (multiTemplateDataRows) {
    return rowDefs.filter(def => !def.when || def.when(dataIndex, data));
  }
  const matched = rowDefs.find(def => def.when?.(dataIndex, data));
  const defaultRowDef = rowDefs.find(def => !def.when);
  const chosen = matched ?? defaultRowDef;
  return chosen ? [chosen] : [];
}
