import {Component, Type} from '@angular/core';
import {MatMenuModule} from '@angular/material/menu';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-menu/. See
// button-toggle.ts for the general approach. Inputs use [prop] bindings: a static attribute
// input is also echoed onto the host element by Angular, which a Qwik component cannot
// distinguish from a prop.
//
// The menu panel itself renders into `.cdk-overlay-container` under <body>, not inside
// `[data-parity-root]` — see this file's spec (angular-parity.spec.ts) for how both the
// trigger area (`[data-parity-root]`) and the overlay are compared. Every trigger below is a
// plain native `<button>` (not `matButton`/`matIconButton`) given a fixed position AND fixed
// size via a *static* inline `style` attribute (never bound), so the overlay's computed pixel
// geometry is identical on both apps regardless of surrounding dev-app chrome.
//
// IMPORTANT, non-obvious: `MatMenu`'s own template is a *lone* `<ng-template>` — the menu's
// content never renders where `<mat-menu>` is declared; it is only ever instantiated later as a
// `TemplatePortal` inside the overlay. But `<mat-menu>` is still a *component* (selector
// `mat-menu`), so Angular still creates and renders its *host* element at the declaration site
// — it just stays empty (no children) there forever. That means every `<mat-menu>` tag in a
// scenario below appears, empty, inside `[data-parity-root]` itself (a sibling of its
// trigger), not just inside the overlay. `MatMenu`'s host bindings
// (`[attr.aria-label]/[attr.aria-labelledby]/[attr.aria-describedby]` all bound to `null`)
// exist specifically to strip the static-attribute-echo (see the `aria-label` scenario below)
// from that empty host tag — confirmed by menu.spec.ts's "should clear the static aria-label
// from the menu host" tests. The Qwik port must render an equivalent empty placeholder element
// at each `<mat-menu>` declaration site for the trigger-root comparison to pass.
@Component({
  template: `
    <div data-parity-root>
      <button
        class="menu-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matMenuTriggerFor]="menu"
        aria-label="Open basic menu">
        Actions
      </button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item>Refresh</button>
        <button mat-menu-item [disabled]="true">Settings</button>
        <button mat-menu-item>Sign Out</button>
      </mat-menu>
    </div>
  `,
  imports: [MatMenuModule],
})
export class MenuBasic {}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="menu-trigger"
        style="position: fixed; top: 80px; left: 360px; width: 140px; height: 48px;"
        [matMenuTriggerFor]="beforeMenu"
        aria-label="Open menu positioned before">
        Before
      </button>
      <mat-menu #beforeMenu="matMenu" [xPosition]="'before'">
        <button mat-menu-item>Item 1</button>
        <button mat-menu-item>Item 2</button>
      </mat-menu>

      <button
        class="menu-trigger"
        style="position: fixed; top: 160px; left: 360px; width: 140px; height: 48px;"
        [matMenuTriggerFor]="afterMenu"
        aria-label="Open menu positioned after">
        After
      </button>
      <mat-menu #afterMenu="matMenu" [xPosition]="'after'">
        <button mat-menu-item>Item 1</button>
        <button mat-menu-item>Item 2</button>
      </mat-menu>

      <button
        class="menu-trigger"
        style="position: fixed; top: 320px; left: 360px; width: 140px; height: 48px;"
        [matMenuTriggerFor]="aboveMenu"
        aria-label="Open menu positioned above">
        Above
      </button>
      <mat-menu #aboveMenu="matMenu" [yPosition]="'above'">
        <button mat-menu-item>Item 1</button>
        <button mat-menu-item>Item 2</button>
      </mat-menu>

      <button
        class="menu-trigger"
        style="position: fixed; top: 400px; left: 360px; width: 140px; height: 48px;"
        [matMenuTriggerFor]="belowMenu"
        aria-label="Open menu positioned below">
        Below
      </button>
      <mat-menu #belowMenu="matMenu" [yPosition]="'below'">
        <button mat-menu-item>Item 1</button>
        <button mat-menu-item>Item 2</button>
      </mat-menu>
    </div>
  `,
  imports: [MatMenuModule],
})
export class MenuPositions {}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="menu-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matMenuTriggerFor]="menu"
        aria-label="Open overlapping menu">
        Actions
      </button>
      <mat-menu #menu="matMenu" [overlapTrigger]="true">
        <button mat-menu-item>Item 1</button>
        <button mat-menu-item>Item 2</button>
      </mat-menu>
    </div>
  `,
  imports: [MatMenuModule],
})
export class MenuOverlapTrigger {}

// `matMenuItemIcon` is a plain content-projection selector attribute (see
// src/material/menu/menu-item.html: `<ng-content select="mat-icon, [matMenuItemIcon]">`) — it
// is not backed by any directive, so there is nothing to bind; a literal, unbound attribute is
// correct here (same category as `mat-card-avatar`, not an `[prop]`-bindable input). Plain
// `<span>`s stand in for `mat-icon` so this scenario needs no icon font/module.
@Component({
  template: `
    <div data-parity-root>
      <button
        class="menu-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matMenuTriggerFor]="menu"
        aria-label="Open menu with icons">
        Actions
      </button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item>
          <span matMenuItemIcon>&#9742;</span>
          <span>Redial</span>
        </button>
        <button mat-menu-item [disabled]="true">
          <span matMenuItemIcon>&#128222;</span>
          <span>Check voicemail</span>
        </button>
        <button mat-menu-item>
          <span matMenuItemIcon>&#128263;</span>
          <span>Disable alerts</span>
        </button>
      </mat-menu>
    </div>
  `,
  imports: [MatMenuModule],
})
export class MenuIcons {}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="menu-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matMenuTriggerFor]="animals"
        aria-label="Open nested menu">
        Animals
      </button>
      <mat-menu #animals="matMenu">
        <button mat-menu-item [matMenuTriggerFor]="vertebrates">Vertebrates</button>
        <button mat-menu-item>Invertebrates</button>
      </mat-menu>
      <mat-menu #vertebrates="matMenu">
        <button mat-menu-item>Fish</button>
        <button mat-menu-item>Birds</button>
      </mat-menu>
    </div>
  `,
  imports: [MatMenuModule],
})
export class MenuNested {}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="menu-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matMenuTriggerFor]="menu"
        aria-label="Open menu without a backdrop">
        Actions
      </button>
      <mat-menu #menu="matMenu" [hasBackdrop]="false">
        <button mat-menu-item>Item 1</button>
        <button mat-menu-item>Item 2</button>
      </mat-menu>
    </div>
  `,
  imports: [MatMenuModule],
})
export class MenuNoBackdrop {}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="menu-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matMenuTriggerFor]="menu"
        aria-label="Open menu with a custom panel class">
        Actions
      </button>
      <mat-menu #menu="matMenu" [class]="'custom-menu-panel'">
        <button mat-menu-item>Item 1</button>
        <button mat-menu-item>Item 2</button>
      </mat-menu>
    </div>
  `,
  imports: [MatMenuModule],
})
export class MenuPanelClass {}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="menu-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matMenuTriggerFor]="menu"
        aria-label="Open labeled menu">
        Actions
      </button>
      <mat-menu #menu="matMenu" [aria-label]="'Account actions'">
        <button mat-menu-item>Item 1</button>
        <button mat-menu-item>Item 2</button>
      </mat-menu>
    </div>
  `,
  imports: [MatMenuModule],
})
export class MenuAriaLabel {}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="menu-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matMenuTriggerFor]="menu"
        aria-label="Open lazily-rendered menu">
        Actions
      </button>
      <mat-menu #menu="matMenu">
        <ng-template matMenuContent>
          <button mat-menu-item>Item 1</button>
          <button mat-menu-item>Item 2</button>
        </ng-template>
      </mat-menu>
    </div>
  `,
  imports: [MatMenuModule],
})
export class MenuLazyContent {}

export const MENU_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': MenuBasic,
  'positions': MenuPositions,
  'overlap-trigger': MenuOverlapTrigger,
  'icons': MenuIcons,
  'nested': MenuNested,
  'no-backdrop': MenuNoBackdrop,
  'panel-class': MenuPanelClass,
  'aria-label': MenuAriaLabel,
  'lazy-content': MenuLazyContent,
};
