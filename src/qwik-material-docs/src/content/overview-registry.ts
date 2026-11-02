// Raw Markdown for the Phase-1 fully-adapted component overviews (button, form-field, select —
// see the design doc's "three fully finished reference components"). Every other component's
// Overview tab falls back to the "being adapted" placeholder (`routes/components/[id]/overview`).
// Add an entry here (and the matching `?raw` import) as more components get adapted in Phase 2.
//
// Each file's own trailing "## Angular → Qwik notes" section (curated from that component's
// SYNC.md — API mapping + deliberate deviations, not a dump) is just more Markdown in the same
// document, same as every other heading — no separate rendering path.
import buttonMd from './overviews/button.md?raw';
import formFieldMd from './overviews/form-field.md?raw';
import selectMd from './overviews/select.md?raw';
import listMd from './overviews/list.md?raw';
import toolbarMd from './overviews/toolbar.md?raw';
import expansionMd from './overviews/expansion.md?raw';
import sortMd from './overviews/sort.md?raw';
import inputMd from './overviews/input.md?raw';
import menuMd from './overviews/menu.md?raw';
import autocompleteMd from './overviews/autocomplete.md?raw';

export const OVERVIEW_MARKDOWN: Record<string, string> = {
  button: buttonMd,
  'form-field': formFieldMd,
  select: selectMd,
  list: listMd,
  toolbar: toolbarMd,
  expansion: expansionMd,
  sort: sortMd,
  input: inputMd,
  menu: menuMd,
  autocomplete: autocompleteMd,
};
