import {component$} from '@qwik.dev/core';
import {
  MatList,
  MatListItem,
  MatListItemTitle,
  MatListItemMeta,
} from '@angular-community/qwik-material/list';
import {MatIcon} from '@angular-community/qwik-material/icon';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';

// Icon swatches had the same inline width:100%/height:100% bug as the
// avatar scenario (overriding the fixed leading-icon size), AND used a
// plain colored <div> instead of a real icon — real usage is
// `<mat-icon matListItemIcon>`, as in list-sections-example.html.
// `MatIcon`'s own `class` prop takes the `matListItemIcon` directive's two
// host classes directly (the directive adds no element of its own
// upstream, just classes on the icon's own host) — same approach as
// `MatIconPrefix`/`MatIconSuffix` elsewhere in this port. Icon names
// ("inbox"/"send"/"drafts") match each item's own label.
//
// `QwikMaterialProvider`'s `matIconConfig={{fontSet: 'material-symbols-outlined'}}`
// mirrors a dev-app-only quirk, NOT a qwik-material default: the Angular
// *dev-app* shell (`DevAppLayout`'s constructor, src/dev-app/dev-app/dev-app-layout.ts)
// calls `MatIconRegistry.setDefaultFontSetClass('material-symbols-outlined')`
// on every boot because its own `DevAppState.m3Enabled` defaults to `true` —
// this reaches every route, including the bare `/qwik-parity/*` scenarios,
// since `DevApp`'s root template always wraps `<router-outlet>` in
// `<dev-app-layout>`. qwik-material's own `MAT_ICON_DEFAULT_FONT_SET_CLASS`
// (icon-config.ts) correctly keeps upstream Material's REAL default
// (`material-icons mat-ligature-font`, matching `MatIconRegistry`'s
// hardcoded class field) — a real consumer app that never calls
// `setDefaultFontSetClass` gets that, not Material Symbols. This provider
// (not a `fontSet` PROP on `<MatIcon>` itself, which would also emit a
// `data-mat-icon-namespace` attribute Angular's un-set registry default
// never adds) exists only so this ONE demo scenario matches THIS dev-app's
// boot-time override. See EXAMPLES.md "Scenario visual cleanup" / mat-list.
export default component$(() => (
  <QwikMaterialProvider matIconConfig={{fontSet: 'material-symbols-outlined'}}>
    <div data-parity-root>
      <MatList role="list">
        <MatListItem
          icon={<MatIcon class="mat-mdc-list-item-icon mdc-list-item__start">inbox</MatIcon>}
          title={<MatListItemTitle>Inbox</MatListItemTitle>}
          meta={<MatListItemMeta>128</MatListItemMeta>}
        />
        <MatListItem
          icon={<MatIcon class="mat-mdc-list-item-icon mdc-list-item__start">send</MatIcon>}
          title={<MatListItemTitle>Sent</MatListItemTitle>}
          meta={<MatListItemMeta>42</MatListItemMeta>}
        />
        <MatListItem
          icon={<MatIcon class="mat-mdc-list-item-icon mdc-list-item__start">drafts</MatIcon>}
          title={<MatListItemTitle>Drafts</MatListItemTitle>}
          meta={<MatListItemMeta>7</MatListItemMeta>}
        />
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
