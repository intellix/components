/**
 * Pure port of `CdkTextColumn`'s default-value logic (src/cdk/table/text-column.ts).
 */

/** `CdkTextColumn._createDefaultHeaderText()` — uppercases ONLY the first
 *  character, leaves the rest of the string untouched (upstream spec:
 *  `propertyA` -> `PropertyA`, the trailing `A` stays uppercase). */
export function createDefaultHeaderText(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** `CdkTextColumn`'s default `dataAccessor`: plain property lookup by
 *  column name. */
export function defaultTextColumnDataAccessor<T>(data: T, name: string): unknown {
  return (data as Record<string, unknown>)[name];
}
