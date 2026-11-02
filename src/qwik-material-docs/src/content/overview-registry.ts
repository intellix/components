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
import dividerMd from './overviews/divider.md?raw';
import formFieldMd from './overviews/form-field.md?raw';
import gridListMd from './overviews/grid-list.md?raw';
import iconMd from './overviews/icon.md?raw';
import progressBarMd from './overviews/progress-bar.md?raw';
import progressSpinnerMd from './overviews/progress-spinner.md?raw';
import radioMd from './overviews/radio.md?raw';
import selectMd from './overviews/select.md?raw';
import slideToggleMd from './overviews/slide-toggle.md?raw';

export const OVERVIEW_MARKDOWN: Record<string, string> = {
  badge: badgeMd,
  'bottom-sheet': bottomSheetMd,
  button: buttonMd,
  'button-toggle': buttonToggleMd,
  card: cardMd,
  checkbox: checkboxMd,
  divider: dividerMd,
  'form-field': formFieldMd,
  'grid-list': gridListMd,
  icon: iconMd,
  'progress-bar': progressBarMd,
  'progress-spinner': progressSpinnerMd,
  radio: radioMd,
  select: selectMd,
  'slide-toggle': slideToggleMd,
};
