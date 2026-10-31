import {
  ChangeDetectorRef,
  Component,
  Injector,
  OnInit,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import {ActivatedRoute, Routes} from '@angular/router';
import {loadExample} from '@angular/components-examples/private';

/**
 * Each component's headline material.angular.dev example (the first `<!-- example(...) -->` in
 * `src/material/<component>/<component>.md`), rendered unmodified so the Qwik port can be diffed
 * against — and visually compared with — real documented usage. Keys match the qwik dev-app
 * route segments: `/qwik-parity/<key>/<route>`.
 */
export const MAIN_EXAMPLES: Record<string, Record<string, string>> = {
  'mat-autocomplete': {'example': 'autocomplete-simple'},
  'mat-badge': {'example': 'badge-overview'},
  'mat-bottom-sheet': {'example': 'bottom-sheet-overview'},
  'mat-button': {'example': 'button-overview'},
  'mat-button-toggle': {'example': 'button-toggle-overview'},
  'mat-card': {'example': 'card-overview'},
  'mat-checkbox': {'example': 'checkbox-overview'},
  'mat-chips': {'example': 'chips-overview'},
  'mat-datepicker': {'example': 'datepicker-overview'},
  'mat-dialog': {'example': 'dialog-overview'},
  'mat-divider': {'example': 'divider-overview'},
  'mat-expansion': {'example': 'expansion-overview'},
  'mat-form-field': {'example': 'form-field-overview', 'example-input': 'input-overview'},
  'mat-grid-list': {'example': 'grid-list-overview'},
  'mat-icon': {'example': 'icon-overview'},
  'mat-list': {'example': 'list-overview'},
  'mat-menu': {'example': 'menu-overview'},
  'mat-paginator': {'example': 'paginator-overview'},
  'mat-progress-bar': {'example': 'progress-bar-determinate'},
  'mat-progress-spinner': {'example': 'progress-spinner-overview'},
  'mat-radio': {'example': 'radio-overview'},
  'mat-select': {'example': 'select-overview'},
  'mat-sidenav': {'example': 'sidenav-overview'},
  'mat-slide-toggle': {'example': 'slide-toggle-overview'},
  'mat-slider': {'example': 'slider-overview'},
  'mat-snack-bar': {'example': 'snack-bar-overview'},
  'mat-sort': {'example': 'sort-overview'},
  'mat-stepper': {'example': 'stepper-overview'},
  'mat-table': {'example': 'table-basic'},
  'mat-tabs': {'example': 'tab-group-basic'},
  'mat-timepicker': {'example': 'timepicker-overview'},
  'mat-toolbar': {'example': 'toolbar-overview'},
  'mat-tooltip': {'example': 'tooltip-overview'},
  'mat-tree': {'example': 'tree-flat-child-accessor-overview'},
};

/** Renders the docs example named by the route's `exampleId` inside `[data-parity-root]`. */
@Component({
  template: `<div data-parity-root><ng-container #outlet /></div>`,
})
export class ExampleScenario implements OnInit {
  @ViewChild('outlet', {read: ViewContainerRef, static: true}) outlet!: ViewContainerRef;
  private _route = inject(ActivatedRoute);
  private _injector = inject(Injector);
  private _changeDetectorRef = inject(ChangeDetectorRef);

  async ngOnInit() {
    const example = await loadExample(this._route.snapshot.data['exampleId'], this._injector);
    this.outlet.createComponent(example.component, {injector: example.injector});
    this._changeDetectorRef.markForCheck();
  }
}

export const EXAMPLE_ROUTES: Routes = Object.entries(MAIN_EXAMPLES).flatMap(
  ([component, examples]) =>
    Object.entries(examples).map(([route, exampleId]) => ({
      path: `${component}/${route}`,
      component: ExampleScenario,
      data: {exampleId},
    })),
);
