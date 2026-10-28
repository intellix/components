import {createContextId, type Signal} from '@builder.io/qwik';

/**
 * State `MatTabNav` publishes for its `MatTabLink` descendants. Unlike
 * `MatTabGroup`'s header labels (rendered from a `tabs` data array because
 * the SAME label also needs to drive a separately-located body — see
 * `mat-tab-group.tsx`'s doc comment), each `<MatTabLink>` is a genuinely
 * self-contained, independently-nestable child: it renders in exactly ONE
 * place (wherever the consumer puts it) and needs no cross-location
 * split, so ordinary `<Slot/>` projection works for the markup itself.
 *
 * The one thing links DO need from a shared place is roving-tabindex focus
 * tracking (`MatTabNav._focusedItem`/`MatTabLink._tabIndex`), which this
 * context carries as the currently-roving-focused link's OWN element —
 * tracked by identity rather than index, since (unlike the header labels)
 * links have no declarative index to begin with. Each `MatTabLink` compares
 * its own ref against this signal; `undefined` (nothing explicitly
 * focused/activated yet, including throughout SSR, where no ref exists at
 * all) falls back to "am I the active link" — see `mat-tab-link.tsx`.
 */
export interface MatTabNavState {
  /** The link that currently holds roving-tabindex focus, once a click or
   *  keyboard interaction has explicitly set one. `undefined` means "nothing
   *  explicit yet — each link falls back to its own `active` prop". */
  focusedLink: Signal<HTMLElement | undefined>;
  /** Whether a `MatTabNavPanel` was supplied (`[tabPanel]`) — governs
   *  role/aria-controls/aria-selected/aria-current on every link
   *  (`_getRole`/`_getAriaControls`/etc; see angular-parity.spec.ts notes
   *  11-13). Always `true` for every scenario this port is gated on. */
  hasTabPanel: boolean;
  /** `MatTabNavPanel.id`, when `hasTabPanel` is true. */
  tabPanelId: string | undefined;
}

export const MAT_TAB_NAV_STATE = createContextId<Signal<MatTabNavState>>(
  'qwik-material/tab-nav-state',
);

/**
 * Fallback for a `<MatTabLink>` rendered without a `<MatTabNav>` ancestor
 * (misuse). Mirrors the project's established "inert default, never throw"
 * convention (see `button-toggle-group-state.ts`'s doc comment).
 */
export const MAT_TAB_NAV_STATE_DEFAULTS: MatTabNavState = {
  focusedLink: {value: undefined} as Signal<HTMLElement | undefined>,
  hasTabPanel: false,
  tabPanelId: undefined,
};
