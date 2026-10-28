/**
 * MatSort/MatSortHeader scenario port from src/material/sort/sort.spec.ts.
 *
 * `createDOM()` hangs this package's vitest worker (see mat-button's own
 * scenario-port comment for the same finding across every qwik-material
 * entry point), so no DOM-render tests are attempted here. The pure
 * direction-cycle math (the bulk of upstream's behavioral assertions) is
 * instead fully covered, DOM-free, in sort-state.spec.ts. Restructured:
 *
 *   - Live sanity tests: typeof + props shape + config defaults.
 *   - describe.skip DOM-rendered: every behavior that needs a real DOM
 *     (aria-sort, class toggling, focus classes, recently-cleared timing,
 *     disabled-header semantics, AriaDescriber id/aria-describedby,
 *     keyboard activation). Covered by
 *     specs/material-sort/angular-parity.spec.ts (the authoritative
 *     Angular-vs-Qwik DOM parity gate — see its header comment for the
 *     full per-scenario contract) and the two Qwik-only
 *     MAT_SORT_DEFAULT_OPTIONS specs (no Angular mirror route exists for
 *     provider defaults, same precedent as every other qwik-material
 *     config).
 *   - describe.skip Angular-only: registration/dev-mode error guards
 *     (`sortables` Map, duplicate/missing id errors, "not contained within
 *     MatSort" error), CdkColumnDef id fallback, MatSortHeaderIntl
 *     (deprecated upstream, unused even there).
 *
 * Real DOM + behavior assertions live in
 * src/qwik-cdk-parity-tests/specs/material-sort/*.spec.ts (Qwik-only DOM
 * specs) and angular-parity.spec.ts (Angular-vs-Qwik DOM diffing).
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_SORT_CONFIG,
  MatSort,
  MatSortHeader,
  type MatSortConfig,
  type MatSortHeaderProps,
  type MatSortProps,
} from './public-api';

describe('MatSort / MatSortHeader surface — sanity', () => {
  it('MatSort is exported and is a function-shaped component', () => {
    expect(typeof MatSort).toBe('function');
  });

  it('MatSortHeader is exported and is a function-shaped component', () => {
    expect(typeof MatSortHeader).toBe('function');
  });

  it('MAT_SORT_CONFIG carries the expected context id + empty config accepts {}', () => {
    expect(MAT_SORT_CONFIG.id).toBe('qwik-material/sort-config');
    const cfg: MatSortConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatSortConfig accepts every upstream MAT_SORT_DEFAULT_OPTIONS field', () => {
    const cfg: MatSortConfig = {disableClear: true, arrowPosition: 'before'};
    expect(cfg.disableClear).toBe(true);
  });

  it('MatSortProps accepts the full upstream-mirrored surface', () => {
    const props: MatSortProps = {
      as: 'table',
      active: 'name',
      start: 'desc',
      direction: 'asc',
      disableClear: true,
      disabled: false,
      onSortChange$: undefined,
      id: 'my-sort',
      class: 'my-class',
    };
    expect(props.active).toBe('name');
    expect(props.start).toBe('desc');
  });

  it('MatSortHeaderProps accepts the full upstream-mirrored surface', () => {
    const props: MatSortHeaderProps = {
      id: 'name',
      arrowPosition: 'before',
      start: 'desc',
      disabled: false,
      sortActionDescription: 'Sort by name',
      disableClear: true,
      class: 'my-class',
    };
    expect(props.id).toBe('name');
    expect(props.arrowPosition).toBe('before');
  });
});

describe.skip('MatSort / MatSortHeader DOM-rendered scenarios — verified via Playwright', () => {
  it('renders <table class="mat-sort"> (or the `as` override) with children passed through unchanged', () => {});
  it('every header always carries aria-describedby on its .mat-sort-header-container, defaulting to a "Sort" description', () => {});
  it('aria-sort is "none" when unsorted, "ascending"/"descending" when this header is the active sorted column, and never set on more than one header at once', () => {});
  it("mat-sort-header-ascending/-descending track the TABLE's current direction on every header, not just the active one (behavior #2)", () => {});
  it("clicking/Enter/Space on a header advances the direction cycle (asc -> desc -> cleared by default; disableClear removes the cleared step; a header's own start/disableClear override the table defaults)", () => {});
  it("mat-sort-header-recently-cleared-ascending/-descending appears exactly when THIS header's own cleared transition just happened, and is cleared only by a focus-origin change or mouseleave — never by a timer", () => {});
  it("a disabled header (via its own `disabled` prop OR the table's `disabled`) has no tabindex/role on its container, renders no arrow unless it is the active sorted column, and its click/keydown handlers no-op entirely", () => {});
  it('cdk-focused + cdk-keyboard-focused/cdk-mouse-focused/cdk-program-focused/cdk-touch-focused apply to the <th> host based on how focus landed on its focusable inner container (useFocusOrigin)', () => {});
  it('arrowPosition="before" adds mat-sort-header-position-before to the container without changing where the arrow div appears in markup', () => {});
  it('MAT_SORT_CONFIG.disableClear applies when neither the table nor a header sets its own disableClear', () => {});
  it("MAT_SORT_CONFIG.arrowPosition applies to every header that doesn't set its own arrowPosition", () => {});
});

describe.skip('MatSort / MatSortHeader — Angular-only tests (deferred forever)', () => {
  it('sortables Map registration/deregistration, "initialized" Observable, _stateChanges Subject', () => {
    // Omitted — Qwik's reactive signal context already notifies descendants
    // directly; no registration bookkeeping is needed to render correctly,
    // and nothing reads the registry for DOM output.
  });
  it('dev-mode errors: missing MatSort ancestor, duplicate sortable id, missing header id, invalid direction value', () => {
    // Omitted — dev-time guards with no DOM-rendering consequence; no parity
    // scenario exercises any of them (see sort-state.ts's MatSortSharedState
    // doc comment: a standalone header renders inert instead of throwing).
  });
  it('CdkColumnDef id fallback (mat-table/cdk-table integration)', () => {
    // Omitted — out of scope per the dev-app scenario contract (sort.ts's
    // header comment: "matSort does not depend on mat-table/cdk-table").
  });
  it('MatSortHeaderIntl', () => {
    // Omitted — deprecated upstream ("No longer used, will be removed"),
    // unused even by MatSort/MatSortHeader themselves.
  });
});
