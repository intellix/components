import {$, component$, useContext, useSignal, type JSXOutput, type QRL} from '@builder.io/qwik';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {MatFormField} from '@angular-community/qwik-material/form-field';
import {MatSelect, type MatSelectOptionDef} from '@angular-community/qwik-material/select';
import {MAT_PAGINATOR_CONFIG, type MatPaginatorConfig} from './paginator-config';
import {DEFAULT_PAGINATOR_INTL, MAT_PAGINATOR_INTL} from './paginator-intl';
import {PaginatorNavButton} from './paginator-nav-button';
import {
  computeChangedPageIndex,
  computeDisplayedPageSizeOptions,
  defaultRangeLabel,
  getNumberOfPages,
  nextButtonsDisabled,
  normalizeLength,
  normalizePageIndex,
  previousButtonsDisabled,
  resolveInitialPageSize,
  type PageEvent,
} from './paginator-math';

export type {PageEvent};

/** Mirrors upstream's `ThemePalette`, narrowed to what `MatPaginator`/`MatFormField` accept. */
export type MatPaginatorColor = 'primary' | 'accent' | 'warn';

/** Mirrors upstream `MatPaginatorSelectConfig` — configures the underlying page-size `MatSelect`. */
export interface MatPaginatorSelectConfig {
  /** Accepted for API parity; has no effect in this port — see `qwik-material/select/SYNC.md`'s
   *  own deviations list (it only ever affected a non-flexible positioning variant this port's
   *  `FlexibleConnectedPositionStrategy` usage doesn't have). */
  disableOptionCentering?: boolean;
  /** Classes to be passed to the select panel. Mirrors `MatSelectProps.panelClass`'s accepted
   *  shapes (a `Set`/record-of-booleans is flattened to a class list; no scenario needs either). */
  panelClass?:
    | string
    | ReadonlyArray<string>
    | ReadonlySet<string>
    | Readonly<Record<string, boolean>>;
}

function normalizeSelectPanelClass(
  value: MatPaginatorSelectConfig['panelClass'],
): string | string[] | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value as string[];
  if (value instanceof Set) return Array.from(value);
  return Object.keys(value).filter(key => !!(value as Record<string, boolean>)[key]);
}

/**
 * Props for `<MatPaginator>`. Mirrors upstream `MatPaginator` (`src/material/paginator/
 * paginator.ts`) — see this package's SYNC.md for the full structural write-up and
 * `src/dev-app/qwik-parity/paginator.ts`'s header (this port's contract source of truth).
 *
 * ## `pageIndex`/`pageSize` are read ONCE, then owned internally (read this before touching them)
 *
 * Mirrors `MatSelect`'s own "why `value` is not a live, reactive prop" — see that component's doc
 * comment in `qwik-material/select/mat-select.tsx`. Upstream's `pageIndex`/`pageSize` ARE plain
 * `@Input`s a consumer could, in principle, keep rebinding after mount — but no scenario in this
 * port's parity contract ever does (every scenario either omits `[pageIndex]` entirely, or sets it
 * once to a literal, unchanging value; `pageSize` IS fed back from the emitted `(page)` event into
 * a BOUND `[pageSize]`, but that's the paginator's OWN emitted value flowing straight back in — not
 * an independent external reassignment). `MatPaginator` owns both via its own internal navigation
 * (`nextPage`/`previousPage`/`firstPage`/`lastPage`/changing the page size) and reports every
 * change via `onPage$` — exactly upstream's own actual data flow for every scenario here. A
 * consumer needing to imperatively reset either from OUTSIDE after mount is not supported yet.
 *
 * `length`/`pageSizeOptions`/`hidePageSize`/`showFirstLastButtons`/`disabled`/`color` are, by
 * contrast, genuinely live — `MatPaginator` never mutates any of them itself, so they're read
 * directly off `props` on every render (no seeding/freezing needed).
 */
export interface MatPaginatorProps {
  /** The length of the total number of items that are being paginated. Default 0. */
  length?: number;
  /** The zero-based page index of the displayed list of items. Default 0. Read ONCE — see the
   *  module doc comment. */
  pageIndex?: number;
  /** Number of items to display on a page. Falls back to `MAT_PAGINATOR_CONFIG.pageSize`, then
   *  the first of `pageSizeOptions`, then 50. Read ONCE — see the module doc comment. */
  pageSize?: number;
  /** The set of provided page size options to display to the user. Falls back to
   *  `MAT_PAGINATOR_CONFIG.pageSizeOptions`, then `[]`. */
  pageSizeOptions?: ReadonlyArray<number>;
  /** Whether to hide the page size selection UI from the user. Falls back to
   *  `MAT_PAGINATOR_CONFIG.hidePageSize`, then `false`. */
  hidePageSize?: boolean;
  /** Whether to show the first/last buttons UI to the user. Falls back to
   *  `MAT_PAGINATOR_CONFIG.showFirstLastButtons`, then `false`. */
  showFirstLastButtons?: boolean;
  /** Used to configure the underlying `MatSelect` inside the paginator. */
  selectConfig?: MatPaginatorSelectConfig;
  /** Whether the paginator is disabled. Default `false`. */
  disabled?: boolean;
  /** Theme color of the underlying form field (M2 themes only — see upstream's own doc comment).
   *  No scenario in this port's contract sets this; passed straight through to the page-size
   *  `<MatFormField>`, same as upstream's `[color]="color"`. */
  color?: MatPaginatorColor;
  /** Mirrors `(page)`. */
  onPage$?: QRL<(event: PageEvent) => void>;
  /**
   * Overrides the computed range-label text entirely (default: `defaultRangeLabel` —
   * `paginator-math.ts`, upstream's own English format). Mirrors upstream
   * `MatPaginatorIntl.getRangeLabel`'s CUSTOMIZABILITY, but as a plain string a consumer computes
   * themselves (from the same `pageIndex`/`pageSize`/`length` their own `onPage$` handler already
   * receives), rather than a pluggable function on the intl object — see
   * `paginator-intl.ts`'s module doc comment for why (a plain function can't safely cross Qwik's
   * SSR-resumability serialization boundary the way `MAT_PAGINATOR_INTL`'s other fields can).
   */
  rangeLabel?: string;
  'aria-label'?: string;
  id?: string;
  class?: string | ReadonlyArray<string>;
  style?: string | Record<string, string | number>;
}

/** Builds a fresh `<svg class="mat-mdc-paginator-icon">` descriptor — one of the four upstream
 *  path shapes. Built fresh on every call (not hoisted to a module-level constant) so each
 *  `<PaginatorNavButton>` gets its own JSX descriptor, same as every other per-render JSX child
 *  in this project. */
function paginatorIcon(d: string): JSXOutput {
  return (
    <svg class="mat-mdc-paginator-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const MAT_PAGINATOR_CONFIG_DEFAULTS: MatPaginatorConfig = {};

export const MatPaginator = component$<MatPaginatorProps>(props => {
  const config = useContext(MAT_PAGINATOR_CONFIG, MAT_PAGINATOR_CONFIG_DEFAULTS);
  const intl = useContext(MAT_PAGINATOR_INTL, DEFAULT_PAGINATOR_INTL);
  const idGen = useIdGenerator();

  const pageSizeOptionsProp = props.pageSizeOptions ?? config.pageSizeOptions ?? [];
  const disabled = props.disabled ?? false;
  const hidePageSize = props.hidePageSize ?? config.hidePageSize ?? false;
  const showFirstLastButtons = props.showFirstLastButtons ?? config.showFirstLastButtons ?? false;
  // Upstream: `defaults?.formFieldAppearance || 'outline'` (note `||`, not `??` — an explicitly
  // empty string would also fall through).
  const formFieldAppearance = config.formFieldAppearance || 'outline';

  // Seeded ONCE — see the module doc comment's "pageIndex/pageSize are read once" section.
  const pageIndexSig = useSignal(() => normalizePageIndex(props.pageIndex));
  const pageSizeSig = useSignal(() => resolveInitialPageSize(props.pageSize, pageSizeOptionsProp));

  // ID for the DOM node containing the paginator's items-per-page label. Memoized — calling
  // `idGen.getId(...)` as a bare, unmemoized render-body expression would subscribe this
  // component to (and increment) the shared id-generator counter on EVERY render, including
  // this component's own re-renders in response to that same write — the exact self-perpetuating
  // reactive loop `qwik-material/select/mat-select.tsx`'s own `resolved` doc comment documents.
  const pageSizeLabelId = useSignal(() => idGen.getId('mat-paginator-page-size-label-'));

  const length = normalizeLength(props.length);
  const displayedPageSizeOptions = computeDisplayedPageSizeOptions(
    pageSizeSig.value,
    pageSizeOptionsProp,
  );

  const previousDisabled = previousButtonsDisabled(pageIndexSig.value, pageSizeSig.value, disabled);
  const nextDisabled = nextButtonsDisabled(pageIndexSig.value, pageSizeSig.value, length, disabled);
  const rangeLabel =
    props.rangeLabel ?? defaultRangeLabel(pageIndexSig.value, pageSizeSig.value, length);

  // Every handler below reads `props`/the signals LIVE, at the moment it actually runs — never a
  // plain local hoisted from the render body above and merely closed over (design doc pitfall:
  // "read props/signals live inside `$()`"). `_buttonClicked`'s own re-check of `isDisabled`
  // exists upstream specifically because `disabledInteractive` buttons stay clickable even while
  // visually disabled (see `PaginatorNavButton`'s doc comment) — recomputing it here from the
  // CURRENT signal values, rather than trusting whatever was true when this render last ran,
  // mirrors that re-check exactly.
  const onFirstClick$ = $(() => {
    const idx = pageIndexSig.value;
    const size = pageSizeSig.value;
    if (previousButtonsDisabled(idx, size, props.disabled ?? false)) return;
    if (idx === 0) return;
    pageIndexSig.value = 0;
    props.onPage$?.({
      previousPageIndex: idx,
      pageIndex: 0,
      pageSize: size,
      length: normalizeLength(props.length),
    });
  });

  const onPreviousClick$ = $(() => {
    const idx = pageIndexSig.value;
    const size = pageSizeSig.value;
    if (previousButtonsDisabled(idx, size, props.disabled ?? false)) return;
    const target = idx - 1;
    if (target === idx) return;
    pageIndexSig.value = target;
    props.onPage$?.({
      previousPageIndex: idx,
      pageIndex: target,
      pageSize: size,
      length: normalizeLength(props.length),
    });
  });

  const onNextClick$ = $(() => {
    const idx = pageIndexSig.value;
    const size = pageSizeSig.value;
    const len = normalizeLength(props.length);
    if (nextButtonsDisabled(idx, size, len, props.disabled ?? false)) return;
    const target = idx + 1;
    if (target === idx) return;
    pageIndexSig.value = target;
    props.onPage$?.({previousPageIndex: idx, pageIndex: target, pageSize: size, length: len});
  });

  const onLastClick$ = $(() => {
    const idx = pageIndexSig.value;
    const size = pageSizeSig.value;
    const len = normalizeLength(props.length);
    if (nextButtonsDisabled(idx, size, len, props.disabled ?? false)) return;
    const target = getNumberOfPages(len, size) - 1;
    if (target === idx) return;
    pageIndexSig.value = target;
    props.onPage$?.({previousPageIndex: idx, pageIndex: target, pageSize: size, length: len});
  });

  // Mirrors `_changePageSize()` — the page-size `<MatSelect>`'s `(selectionChange)`.
  const onPageSizeChange$ = $((value: unknown) => {
    const newSize = Number(value);
    const idx = pageIndexSig.value;
    const size = pageSizeSig.value;
    const previousPageIndex = idx;
    pageIndexSig.value = computeChangedPageIndex(idx, size, newSize);
    pageSizeSig.value = newSize;
    props.onPage$?.({
      previousPageIndex,
      pageIndex: pageIndexSig.value,
      pageSize: newSize,
      length: normalizeLength(props.length),
    });
  });

  // Mirrors `<div class="mat-mdc-paginator-touch-target" (click)="selectRef.open()">` —
  // upstream calls the select's own `open()` method directly (bypassing its trigger's click
  // handler entirely, since the touch-target physically covers it — see this package's SYNC.md).
  // This port's `MatSelect` has no imperative `open()` escape hatch, so instead this dispatches a
  // real click at the select's own trigger div — the SAME element a click that reached THROUGH
  // the touch-target would have hit, producing the identical open-panel behavior (including the
  // select's own `disabled` guard no-op'ing it for free when the paginator is disabled).
  // `event.target`, never `event.currentTarget` — see `PaginatorNavButton`'s matching doc comment
  // for why (QRL handlers resolve lazily, after the DOM has already reset `currentTarget`).
  //
  // The explicit `.focus()` call mirrors a SEPARATE upstream mechanism this took confirming live
  // to find: `form-field.html`'s wrapper carries `(click)="_control.onContainerClick($event)"`,
  // and `MatSelect.onContainerClick()` (`select.ts`) calls `this.focus(); this.open();` for any
  // click landing anywhere in the form field's own container — including the touch-target, which
  // lives inside it (see `MatFormField.infixContent`). Without this, the embedded form field
  // never gains `mat-focused`/`mdc-text-field--focused` after a touch-target-driven open —
  // confirmed live as a real diff. Native `.focus()` on `<mat-select>` triggers this port's own
  // `onHostFocus$` (mat-select.tsx), which writes `formField.focused = true` the same way a
  // direct `.focus()`/Tab-to-select interaction already does elsewhere in this project.
  const onTouchTargetClick$ = $((event: Event) => {
    const touchTarget = event.target as HTMLElement;
    const select = touchTarget.previousElementSibling as HTMLElement | null;
    select?.focus();
    const trigger = select?.querySelector<HTMLElement>('.mat-mdc-select-trigger');
    trigger?.click();
  });

  const hostClasses = ['mat-mdc-paginator', props.class].filter(Boolean) as string[];

  // `echoValueAttr: false` — upstream's REAL `<mat-option [value]="pageSizeOption">`
  // (paginator.html) is a genuine property binding, never echoed as a DOM attribute. See
  // `MatOptionProps.echoValueAttr`'s doc comment (core/mat-option.tsx).
  const selectOptions: MatSelectOptionDef<number>[] = displayedPageSizeOptions.map(n => ({
    value: n,
    label: String(n),
    echoValueAttr: false,
  }));

  return (
    <mat-paginator
      id={props.id}
      role="group"
      class={hostClasses}
      style={props.style}
      aria-label={props['aria-label']}
    >
      <div class="mat-mdc-paginator-outer-container">
        <div class="mat-mdc-paginator-container">
          {!hidePageSize && (
            <div class="mat-mdc-paginator-page-size">
              <div
                class="mat-mdc-paginator-page-size-label"
                id={pageSizeLabelId.value}
                aria-hidden="true"
              >
                {intl.itemsPerPageLabel}
              </div>

              {displayedPageSizeOptions.length > 1 ? (
                <MatFormField
                  appearance={formFieldAppearance}
                  // `?? null`, not just `props.color` — upstream's `paginator.html` ALWAYS
                  // binds `[color]="color"`, even when MatPaginator's own `color` is unset, which
                  // OVERWRITES MatFormField's own class-field default ('primary') with literal
                  // `undefined` — distinct from every OTHER select scenario's `<mat-form-field>`,
                  // which never binds `[color]` at all (default survives untouched). See
                  // `MatFormFieldProps.color`'s own doc comment (form-field/mat-form-field.tsx).
                  color={props.color ?? null}
                  class="mat-mdc-paginator-page-size-select"
                  control={
                    <MatSelect
                      controlType="mat-select"
                      value={pageSizeSig.value}
                      disabled={disabled}
                      onValueChange$={onPageSizeChange$}
                      aria-labelledby={pageSizeLabelId.value}
                      panelClass={normalizeSelectPanelClass(props.selectConfig?.panelClass)}
                      hideSingleSelectionIndicator
                      options={selectOptions}
                    />
                  }
                  infixContent={
                    <div class="mat-mdc-paginator-touch-target" onClick$={onTouchTargetClick$} />
                  }
                />
              ) : (
                <div class="mat-mdc-paginator-page-size-value">{pageSizeSig.value}</div>
              )}
            </div>
          )}

          <div class="mat-mdc-paginator-range-actions">
            <div
              class="mat-mdc-paginator-range-label"
              aria-atomic="true"
              aria-live="polite"
              role="status"
            >
              {rangeLabel}
            </div>

            {showFirstLastButtons && (
              <PaginatorNavButton
                class="mat-mdc-paginator-navigation-first"
                label={intl.firstPageLabel}
                disabled={previousDisabled}
                onClick$={onFirstClick$}
                icon={paginatorIcon('M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z')}
              />
            )}
            <PaginatorNavButton
              class="mat-mdc-paginator-navigation-previous"
              label={intl.previousPageLabel}
              disabled={previousDisabled}
              onClick$={onPreviousClick$}
              icon={paginatorIcon('M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z')}
            />
            <PaginatorNavButton
              class="mat-mdc-paginator-navigation-next"
              label={intl.nextPageLabel}
              disabled={nextDisabled}
              onClick$={onNextClick$}
              icon={paginatorIcon('M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z')}
            />
            {showFirstLastButtons && (
              <PaginatorNavButton
                class="mat-mdc-paginator-navigation-last"
                label={intl.lastPageLabel}
                disabled={nextDisabled}
                onClick$={onLastClick$}
                icon={paginatorIcon('M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z')}
              />
            )}
          </div>
        </div>
      </div>
    </mat-paginator>
  );
});
