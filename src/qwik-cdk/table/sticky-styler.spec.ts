import {describe, expect, it} from 'vitest';
import {
  StickyStyler,
  createVirtualStickyElement,
  getCalculatedZIndex,
  virtualStickyElementToProps,
  type VirtualStickyElement,
} from './sticky-styler';

describe('getCalculatedZIndex', () => {
  it('returns empty string when nothing is sticky', () => {
    expect(getCalculatedZIndex(createVirtualStickyElement())).toBe('');
  });

  it('sums increments for every direction currently set inline', () => {
    const el = createVirtualStickyElement();
    el.style.top = '0px';
    expect(getCalculatedZIndex(el)).toBe('100');
    el.style.left = '0px';
    expect(getCalculatedZIndex(el)).toBe('101');
  });

  it('bottom alone is 10, left/right alone is 1', () => {
    const bottom = createVirtualStickyElement();
    bottom.style.bottom = '0px';
    expect(getCalculatedZIndex(bottom)).toBe('10');

    const right = createVirtualStickyElement();
    right.style.right = '0px';
    expect(getCalculatedZIndex(right)).toBe('1');
  });
});

describe('StickyStyler.addStickyStyle / removeStickyStyle', () => {
  it('adds the sticky class, border class (when requested), direction style, and z-index', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const el = createVirtualStickyElement();
    styler.addStickyStyle(el, 'top', 0, true);
    expect(el.classes.has('mat-mdc-table-sticky')).toBe(true);
    expect(el.classes.has('mat-mdc-table-sticky-border-elem-top')).toBe(true);
    expect(el.style.top).toBe('0px');
    expect(el.style.zIndex).toBe('100');
    // needsPositionStickyOnElement=false (Material) never sets `position`.
    expect(el.style.position).toBeUndefined();
  });

  it('needsPositionStickyOnElement=true sets position:sticky', () => {
    const styler = new StickyStyler('cdk-table-sticky', true, 'ltr');
    const el = createVirtualStickyElement();
    styler.addStickyStyle(el, 'left', 12, false);
    expect(el.style.position).toBe('sticky');
    expect(el.classes.has('cdk-table-sticky-border-elem-left')).toBe(false);
  });

  it('accumulates z-index across multiple directions applied in sequence (top then left)', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const el = createVirtualStickyElement();
    styler.addStickyStyle(el, 'top', 0, true);
    styler.addStickyStyle(el, 'left', 0, true);
    expect(el.style.top).toBe('0px');
    expect(el.style.left).toBe('0px');
    expect(el.style.zIndex).toBe('101');
    expect(el.classes.has('mat-mdc-table-sticky-border-elem-top')).toBe(true);
    expect(el.classes.has('mat-mdc-table-sticky-border-elem-left')).toBe(true);
  });

  it('removeStickyStyle is a no-op on an element that was never stuck', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const el = createVirtualStickyElement();
    styler.removeStickyStyle(el, ['bottom']);
    expect(el.classes.size).toBe(0);
    expect(Object.keys(el.style)).toHaveLength(0);
  });

  it('removeStickyStyle clears only the requested direction, keeping others + recomputing z-index', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const el = createVirtualStickyElement();
    styler.addStickyStyle(el, 'top', 0, false);
    styler.addStickyStyle(el, 'left', 0, false);
    styler.removeStickyStyle(el, ['top']);
    expect(el.style.top).toBeUndefined();
    expect(el.style.left).toBe('0px');
    expect(el.style.zIndex).toBe('1');
    expect(el.classes.has('mat-mdc-table-sticky')).toBe(true);
  });

  it('removeStickyStyle strips the sticky class entirely once no direction remains', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const el = createVirtualStickyElement();
    styler.addStickyStyle(el, 'bottom', 0, false);
    styler.removeStickyStyle(el, ['bottom']);
    expect(el.classes.has('mat-mdc-table-sticky')).toBe(false);
    expect(el.style.zIndex).toBeUndefined();
  });
});

describe('StickyStyler column position math', () => {
  const styler = new StickyStyler('cdk-table-sticky');

  it('getStickyStartColumnPositions accumulates preceding sticky widths', () => {
    expect(
      styler.getStickyStartColumnPositions([50, 50, 50, 50], [true, false, false, false]),
    ).toEqual([0]);
    expect(
      styler.getStickyStartColumnPositions([50, 50, 50, 50], [true, true, false, false]),
    ).toEqual([0, 50]);
  });

  it('a single sticky-start column is always offset 0 regardless of width', () => {
    expect(styler.getStickyStartColumnPositions([999], [true])).toEqual([0]);
  });

  it('getStickyEndColumnPositions replicates the upstream off-by-one bound (index 0 never assigned)', () => {
    const positions = styler.getStickyEndColumnPositions(
      [50, 50, 50, 50],
      [false, false, false, true],
    );
    expect(positions[3]).toBe(0);
    expect(positions[0]).toBeUndefined();
  });

  it('a single sticky-end column (last index) is offset 0', () => {
    expect(styler.getStickyEndColumnPositions([10, 20, 30], [false, false, true])[2]).toBe(0);
  });

  it('two sticky-end columns accumulate from the rightmost inward', () => {
    // widths=[10,20,30], sticky-end on indices 1 and 2: position[2]=0, position[1]=30.
    const positions = styler.getStickyEndColumnPositions([10, 20, 30], [false, true, true]);
    expect(positions[2]).toBe(0);
    expect(positions[1]).toBe(30);
  });
});

describe('StickyStyler.stickRows', () => {
  function row(
    sticky: boolean,
    height = 0,
  ): {
    sticky: boolean;
    height: number;
    cells: VirtualStickyElement[];
    row: VirtualStickyElement;
  } {
    return {
      sticky,
      height,
      cells: [createVirtualStickyElement(), createVirtualStickyElement()],
      row: createVirtualStickyElement(),
    };
  }

  it('native table: sticks every cell of a sticky header row at top:0 with the border-top class', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const headerRow = row(true);
    styler.stickRows([headerRow], 'top', true);
    for (const cell of headerRow.cells) {
      expect(cell.style.top).toBe('0px');
      expect(cell.classes.has('mat-mdc-table-sticky')).toBe(true);
      expect(cell.classes.has('mat-mdc-table-sticky-border-elem-top')).toBe(true);
    }
    // The row element itself is untouched in native-table mode.
    expect(headerRow.row.classes.size).toBe(0);
  });

  it('flex table: sticks the row element itself, not its cells', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const headerRow = row(true);
    styler.stickRows([headerRow], 'top', false);
    expect(headerRow.row.style.top).toBe('0px');
    expect(headerRow.row.classes.has('mat-mdc-table-sticky')).toBe(true);
    for (const cell of headerRow.cells) expect(cell.classes.size).toBe(0);
  });

  it('non-sticky rows are left completely untouched', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const r = row(false);
    styler.stickRows([r], 'top', true);
    expect(r.cells[0].classes.size).toBe(0);
    expect(r.row.classes.size).toBe(0);
  });

  it('two stacked sticky header rows: second stacks beneath the first by the first row height', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const first = row(true, 48);
    const second = row(true, 48);
    styler.stickRows([first, second], 'top', true);
    expect(first.cells[0].style.top).toBe('0px');
    expect(second.cells[0].style.top).toBe('48px');
    // Only the LAST sticky row (closest to non-sticky content) is bordered.
    expect(first.cells[0].classes.has('mat-mdc-table-sticky-border-elem-top')).toBe(false);
    expect(second.cells[0].classes.has('mat-mdc-table-sticky-border-elem-top')).toBe(true);
  });

  it('footer rows accumulate from the bottommost sticky row outward (reversed)', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const first = row(true, 52); // topmost footer row
    const second = row(true, 52); // bottommost footer row
    styler.stickRows([first, second], 'bottom', true);
    // Bottommost row gets bottom:0; the one above it stacks by the bottommost's height.
    expect(second.cells[0].style.bottom).toBe('0px');
    expect(first.cells[0].style.bottom).toBe('52px');
    // The bordered row for 'bottom' is the TOPMOST sticky footer row (closest
    // to non-sticky content above it) — index 0 in the reversed array ends
    // up being `second`'s original position... reversed([first,second]) =
    // [second,first]; lastIndexOfTrue over [true,true] is index 1 -> `first`.
    expect(first.cells[0].classes.has('mat-mdc-table-sticky-border-elem-bottom')).toBe(true);
    expect(second.cells[0].classes.has('mat-mdc-table-sticky-border-elem-bottom')).toBe(false);
  });
});

describe('StickyStyler.updateStickyColumns', () => {
  it('applies start then end sticky styling per cell, z-index reflecting both when combined with a sticky row', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    // 4 columns: name(start), position, weight, actions(end) — matches the
    // sticky-header-column-end parity scenario exactly.
    const headerCells = [
      createVirtualStickyElement(),
      createVirtualStickyElement(),
      createVirtualStickyElement(),
      createVirtualStickyElement(),
    ];
    // Simulate the header row already having been top-stuck (as CdkTable's
    // updateStickyHeaderRowStyles runs BEFORE updateStickyColumnStyles).
    for (const cell of headerCells) styler.addStickyStyle(cell, 'top', 0, true);

    styler.updateStickyColumns(
      [{cells: headerCells}],
      [true, false, false, false],
      [false, false, false, true],
      [0, 0, 0, 0],
    );

    expect(headerCells[0].style.left).toBe('0px');
    expect(headerCells[0].style.zIndex).toBe('101'); // top(100) + left(1)
    expect(headerCells[0].classes.has('mat-mdc-table-sticky-border-elem-left')).toBe(true);

    expect(headerCells[3].style.right).toBe('0px');
    expect(headerCells[3].style.zIndex).toBe('101'); // top(100) + right(1)
    expect(headerCells[3].classes.has('mat-mdc-table-sticky-border-elem-right')).toBe(true);

    // Middle columns: only the top treatment, untouched by the column pass.
    expect(headerCells[1].style.left).toBeUndefined();
    expect(headerCells[1].style.right).toBeUndefined();
    expect(headerCells[1].style.zIndex).toBe('100');
    expect(headerCells[2].style.zIndex).toBe('100');
  });

  it('data rows (no prior top-sticky) get only left/right, z-index 1', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const dataCells = [
      createVirtualStickyElement(),
      createVirtualStickyElement(),
      createVirtualStickyElement(),
      createVirtualStickyElement(),
    ];
    styler.updateStickyColumns(
      [{cells: dataCells}],
      [true, false, false, false],
      [false, false, false, true],
      [0, 0, 0, 0],
    );
    expect(dataCells[0].style.left).toBe('0px');
    expect(dataCells[0].style.zIndex).toBe('1');
    expect(dataCells[3].style.right).toBe('0px');
    expect(dataCells[3].style.zIndex).toBe('1');
    expect(dataCells[1].classes.size).toBe(0);
    expect(dataCells[2].classes.size).toBe(0);
  });

  it('is a no-op when no column is sticky on either side', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const cells = [createVirtualStickyElement(), createVirtualStickyElement()];
    styler.updateStickyColumns([{cells}], [false, false], [false, false], [0, 0]);
    expect(cells[0].classes.size).toBe(0);
    expect(cells[1].classes.size).toBe(0);
  });

  it('RTL swaps which physical side start/end stick to', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'rtl');
    const cells = [createVirtualStickyElement(), createVirtualStickyElement()];
    styler.updateStickyColumns([{cells}], [true, false], [false, true], [0, 0]);
    expect(cells[0].style.right).toBe('0px'); // start -> right in RTL
    expect(cells[1].style.left).toBe('0px'); // end -> left in RTL
  });
});

describe('StickyStyler.updateStickyFooterContainer', () => {
  it('zero footer rows: vacuously "all sticky" -> adds bottom:0 + sticky class', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const tfoot = createVirtualStickyElement();
    styler.updateStickyFooterContainer(tfoot, []);
    expect(tfoot.classes.has('mat-mdc-table-sticky')).toBe(true);
    expect(tfoot.style.bottom).toBe('0px');
    expect(tfoot.style.zIndex).toBe('10');
  });

  it('one non-sticky footer row present: leaves a bare container (no class/style)', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const tfoot = createVirtualStickyElement();
    styler.updateStickyFooterContainer(tfoot, [false]);
    expect(tfoot.classes.size).toBe(0);
    expect(Object.keys(tfoot.style)).toHaveLength(0);
  });

  it('all footer rows sticky (non-vacuous): adds bottom:0 + sticky class', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const tfoot = createVirtualStickyElement();
    styler.updateStickyFooterContainer(tfoot, [true, true]);
    expect(tfoot.classes.has('mat-mdc-table-sticky')).toBe(true);
    expect(tfoot.style.bottom).toBe('0px');
  });

  it('mixed sticky states: removes any previously-applied bottom sticky styling', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const tfoot = createVirtualStickyElement();
    styler.addStickyStyle(tfoot, 'bottom', 0, false);
    styler.updateStickyFooterContainer(tfoot, [true, false]);
    expect(tfoot.classes.has('mat-mdc-table-sticky')).toBe(false);
    expect(tfoot.style.bottom).toBeUndefined();
  });
});

describe('virtualStickyElementToProps', () => {
  it('returns undefined style when nothing was ever set', () => {
    const {classes, style} = virtualStickyElementToProps(createVirtualStickyElement());
    expect(classes).toEqual([]);
    expect(style).toBeUndefined();
  });

  it('returns the accumulated classes/style otherwise', () => {
    const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');
    const el = createVirtualStickyElement();
    styler.addStickyStyle(el, 'top', 0, true);
    const {classes, style} = virtualStickyElementToProps(el);
    expect(classes.sort()).toEqual(
      ['mat-mdc-table-sticky', 'mat-mdc-table-sticky-border-elem-top'].sort(),
    );
    expect(style).toEqual({top: '0px', zIndex: '100'});
  });
});
