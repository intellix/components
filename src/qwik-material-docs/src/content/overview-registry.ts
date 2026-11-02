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
import cardMd from './overviews/card.md?raw';
import formFieldMd from './overviews/form-field.md?raw';
import selectMd from './overviews/select.md?raw';

export const OVERVIEW_MARKDOWN: Record<string, string> = {
  badge: badgeMd,
  'bottom-sheet': bottomSheetMd,
  button: buttonMd,
  card: cardMd,
  'form-field': formFieldMd,
  select: selectMd,
};
