import {$, component$, useContext, useSignal, type NoSerialize} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import type {OverlayRef} from '@angular-community/qwik-cdk/overlay';
import type {FocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {QwikMaterialProvider, useAnimationsDisabled} from '@angular-community/qwik-material/dialog';
import {
  MatMenu,
  MatMenuItem,
  createMatMenu,
  MAT_MENU_DEFAULT_OPTIONS,
  openMenu,
  closeMenu,
  type MenuRuntimeSignals,
  type MenuCloseReason,
} from '@angular-community/qwik-material/menu';

/**
 * Port of material.angular.dev's `menu-overview` docs example
 * (src/components-examples/material/menu/menu-overview/). The real template combines TWO
 * directives on one native `<button>` — bare `matButton` (no appearance value, so the "text"
 * appearance) AND `[matMenuTriggerFor]="menu"` — but every existing qwik-material directive-style
 * component (`MatButton`, `MatMenuTrigger`) renders its OWN host element (the port's established
 * "polymorphic `as` prop, no extra wrapper" pattern, see design doc rule 4), so no two of them can
 * currently share one native element the way two real Angular directives can. Rather than extend
 * a shared, widely-used component's prop surface for this one combination, this route owns the
 * single `<button>` itself and reproduces BOTH directives' real, verified-live DOM/behavior
 * directly, composed from already-exported building blocks:
 *   - `MatButton`'s own "text"-appearance + lazy ripple-loader markup (`mat-mdc-button-base
 *     mdc-button mat-mdc-button mat-unthemed`, the four static spans, the lazy `mat-ripple-
 *     loader-*` host attrs — see `qwik-material/button/mat-button.tsx`) is plain, static JSX
 *     copied verbatim; the one piece of actual BEHAVIOR it needs (the ripple span appearing,
 *     lazily, after a real interaction) is reproduced with a local signal flipped from this
 *     button's own `onClick$` — this scenario's only interaction.
 *   - The menu-opening behavior itself uses `openMenu`/`closeMenu` — the exact same exported
 *     runtime functions `<MatMenuTrigger>` calls internally (`qwik-material/menu/menu-runtime.ts`)
 *     — so this is the SAME engine, just driven from a button this route owns instead of one
 *     `<MatMenuTrigger as="button">` would render itself.
 * `aria-haspopup`/`aria-expanded`/`aria-controls` are computed the same way `MatMenuTrigger`
 * computes them for its own host.
 *
 * Scope: this route's own interaction (see specs/examples/angular-parity.spec.ts) only opens the
 * menu — the trigger button never loses/regains focus in that flow (confirmed live: Angular
 * auto-focuses the first menu item on open, so the trigger itself never shows a FocusMonitor
 * class at the compared step), so `useFocusOrigin()`-style focus-class tracking isn't needed here.
 */
export default component$(() => {
  const ctx = useContext(QWIK_CDK);
  const defaults = useContext(MAT_MENU_DEFAULT_OPTIONS, {});
  const animationsDisabled = useAnimationsDisabled();

  const hostRef = useSignal<HTMLElement>();
  const overlayRef = useSignal<NoSerialize<OverlayRef>>();
  const isOpen = useSignal(false);
  const panelId = useSignal<string>();
  const pendingReason = useSignal<MenuCloseReason | undefined>();
  const rippleInitialized = useSignal(false);

  const signals: MenuRuntimeSignals = {overlayRef, isOpen, panelId, pendingReason};

  const menu = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem>Item 1</MatMenuItem>
        <MatMenuItem>Item 2</MatMenuItem>
      </>
    )),
  });

  const open$ = $(async () => {
    if (!isBrowser || !hostRef.value || isOpen.value) return;
    const itemsJsx = await menu.content$();
    if (overlayRef.value || !hostRef.value) return;
    openMenu(itemsJsx, {
      ctx,
      signals,
      menu,
      defaults,
      triggerEl: hostRef.value,
      isSubmenu: false,
      animationsDisabled: animationsDisabled.value,
      direction: ctx.direction.value === 'rtl' ? 'rtl' : 'ltr',
      autoFocus: true,
      origin: 'mouse' as FocusOrigin,
      restoreFocus: true,
      restoreFocusTo: () => hostRef.value?.focus(),
      onClosed: () => {},
    });
  });

  const close$ = $(() => closeMenu(signals, undefined));

  const handleClick$ = $(() => {
    rippleInitialized.value = true;
    if (isOpen.value) {
      void close$();
    } else {
      void open$();
    }
  });

  return (
    <QwikMaterialProvider>
      <div data-parity-root>
        <menu-overview-example>
          <button
            ref={hostRef}
            class="mdc-button mat-mdc-button-base mat-mdc-menu-trigger mat-mdc-button mat-unthemed"
            mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
            mat-ripple-loader-class-name="mat-mdc-button-ripple"
            aria-haspopup="menu"
            aria-expanded={isOpen.value ? 'true' : 'false'}
            aria-controls={isOpen.value ? panelId.value : undefined}
            onClick$={handleClick$}
          >
            <span class="mat-mdc-button-persistent-ripple mdc-button__ripple" />
            <span class="mdc-button__label">Menu</span>
            <span class="mat-focus-indicator" />
            <span class="mat-mdc-button-touch-target" />
            {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
          </button>
          <MatMenu />
        </menu-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </QwikMaterialProvider>
  );
});
