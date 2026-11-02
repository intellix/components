// Raw Markdown for the Phase-1 fully-adapted component overviews (button, form-field, select —
// see the design doc's "three fully finished reference components"). Every other component's
// Overview tab falls back to the "being adapted" placeholder (`routes/components/[id]/overview`).
// Add an entry here (and the matching `?raw` import) as more components get adapted in Phase 2.
//
// Each file's own trailing "## Angular → Qwik notes" section (curated from that component's
// SYNC.md — API mapping + deliberate deviations, not a dump) is just more Markdown in the same
// document, same as every other heading — no separate rendering path.
import badgeMd from './overviews/badge.md?raw';
import bottomSheetMd from './overviews/bottom-sheet.md?raw';
import buttonMd from './overviews/button.md?raw';
import buttonToggleMd from './overviews/button-toggle.md?raw';
import cardMd from './overviews/card.md?raw';
import checkboxMd from './overviews/checkbox.md?raw';
import chipsMd from './overviews/chips.md?raw';
import dialogMd from './overviews/dialog.md?raw';
import dividerMd from './overviews/divider.md?raw';
import formFieldMd from './overviews/form-field.md?raw';
import gridListMd from './overviews/grid-list.md?raw';
import iconMd from './overviews/icon.md?raw';
import progressBarMd from './overviews/progress-bar.md?raw';
import progressSpinnerMd from './overviews/progress-spinner.md?raw';
import radioMd from './overviews/radio.md?raw';
import selectMd from './overviews/select.md?raw';
import listMd from './overviews/list.md?raw';
import toolbarMd from './overviews/toolbar.md?raw';
import expansionMd from './overviews/expansion.md?raw';
import sortMd from './overviews/sort.md?raw';
import inputMd from './overviews/input.md?raw';
import menuMd from './overviews/menu.md?raw';
import autocompleteMd from './overviews/autocomplete.md?raw';
import timepickerMd from './overviews/timepicker.md?raw';
import datepickerMd from './overviews/datepicker.md?raw';
import sidenavMd from './overviews/sidenav.md?raw';
import tabsMd from './overviews/tabs.md?raw';
import stepperMd from './overviews/stepper.md?raw';
import tableMd from './overviews/table.md?raw';
import sliderMd from './overviews/slider.md?raw';
import slideToggleMd from './overviews/slide-toggle.md?raw';
import snackBarMd from './overviews/snack-bar.md?raw';
import tooltipMd from './overviews/tooltip.md?raw';

export const OVERVIEW_MARKDOWN: Record<string, string> = {
  badge: badgeMd,
  'bottom-sheet': bottomSheetMd,
  button: buttonMd,
  'button-toggle': buttonToggleMd,
  card: cardMd,
  checkbox: checkboxMd,
  chips: chipsMd,
  dialog: dialogMd,
  divider: dividerMd,
  'form-field': formFieldMd,
  'grid-list': gridListMd,
  icon: iconMd,
  'progress-bar': progressBarMd,
  'progress-spinner': progressSpinnerMd,
  radio: radioMd,
  select: selectMd,
  list: listMd,
  toolbar: toolbarMd,
  expansion: expansionMd,
  sort: sortMd,
  input: inputMd,
  menu: menuMd,
  autocomplete: autocompleteMd,
  timepicker: timepickerMd,
  datepicker: datepickerMd,
  sidenav: sidenavMd,
  tabs: tabsMd,
  stepper: stepperMd,
  table: tableMd,
  slider: sliderMd,
  'slide-toggle': slideToggleMd,
  'snack-bar': snackBarMd,
  tooltip: tooltipMd,
};
