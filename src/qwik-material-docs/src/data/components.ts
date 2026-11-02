/**
 * The qwik-material component catalog. One entry per entry point under `src/qwik-material/<id>`
 * (verified against that directory listing — 35 entry points, not the 34 the design doc's
 * rough count expected; `input` is its own material.angular.dev component page, separate from
 * `form-field`, which is the likely source of the off-by-one).
 *
 * `devAppId` is the `src/qwik-cdk-dev-app/src/routes/<devAppId>` segment (and the
 * `src/dev-app/qwik-parity/examples.ts` key) — needed to resolve this component's headline
 * example and its upstream Angular parity route.
 */
export interface ComponentCategory {
  id: string;
  name: string;
}

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {id: 'forms', name: 'Form Controls'},
  {id: 'navigation', name: 'Navigation'},
  {id: 'layout', name: 'Layout'},
  {id: 'buttons', name: 'Buttons & Indicators'},
  {id: 'popups', name: 'Popups & Modals'},
  {id: 'data-table', name: 'Data Table'},
];

export interface ComponentEntry {
  /** Matches `src/qwik-material/<id>` and this site's `/components/<id>` route. */
  id: string;
  name: string;
  category: string;
  /** One line for the category-list card. */
  summary: string;
  /** `src/qwik-cdk-dev-app/src/routes/<devAppId>` segment / `qwik-parity/examples.ts` key. */
  devAppId: string;
  /** `@angular-community/qwik-material/<entryPoint>` import specifier segment. */
  entryPoint: string;
  /** Whether a Phase-1 hand-adapted Overview guide exists for this component (button, form-field,
   *  select). Every other component gets the "being adapted" placeholder Overview tab. */
  hasOverviewGuide?: boolean;
}

export const COMPONENTS: ComponentEntry[] = [
  {
    id: 'autocomplete',
    name: 'Autocomplete',
    category: 'forms',
    summary: 'Suggests options as the user types into a text input.',
    devAppId: 'mat-autocomplete',
    entryPoint: 'autocomplete',
    hasOverviewGuide: true,
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'buttons',
    summary: 'A small status descriptor overlaid on another element, like an icon or button.',
    devAppId: 'mat-badge',
    entryPoint: 'badge',
  },
  {
    id: 'bottom-sheet',
    name: 'Bottom Sheet',
    category: 'popups',
    summary: 'A panel that slides up from the bottom edge of the screen.',
    devAppId: 'mat-bottom-sheet',
    entryPoint: 'bottom-sheet',
  },
  {
    id: 'button',
    name: 'Button',
    category: 'buttons',
    summary: 'Native button and anchor elements enhanced with Material Design styling.',
    devAppId: 'mat-button',
    entryPoint: 'button',
    hasOverviewGuide: true,
  },
  {
    id: 'button-toggle',
    name: 'Button Toggle',
    category: 'buttons',
    summary: 'On/off and single/multiple selection of a set of button-shaped options.',
    devAppId: 'mat-button-toggle',
    entryPoint: 'button-toggle',
  },
  {
    id: 'card',
    name: 'Card',
    category: 'layout',
    summary: 'A styled content container with header, image, actions, and footer sections.',
    devAppId: 'mat-card',
    entryPoint: 'card',
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'forms',
    summary: 'A checked/unchecked/indeterminate selection control, Material Design styled.',
    devAppId: 'mat-checkbox',
    entryPoint: 'checkbox',
  },
  {
    id: 'chips',
    name: 'Chips',
    category: 'forms',
    summary: 'Compact elements for input, attributes, or actions, as a set.',
    devAppId: 'mat-chips',
    entryPoint: 'chips',
  },
  {
    id: 'datepicker',
    name: 'Datepicker',
    category: 'forms',
    summary: 'A calendar-backed input for picking a single date.',
    devAppId: 'mat-datepicker',
    entryPoint: 'datepicker',
  },
  {
    id: 'dialog',
    name: 'Dialog',
    category: 'popups',
    summary: 'A modal overlay that blocks interaction with the rest of the page.',
    devAppId: 'mat-dialog',
    entryPoint: 'dialog',
  },
  {
    id: 'divider',
    name: 'Divider',
    category: 'layout',
    summary: 'A thin line that groups content into sections.',
    devAppId: 'mat-divider',
    entryPoint: 'divider',
  },
  {
    id: 'expansion',
    name: 'Expansion Panel',
    category: 'layout',
    summary: 'An expandable panel, and an accordion of several panels.',
    devAppId: 'mat-expansion',
    entryPoint: 'expansion',
  },
  {
    id: 'form-field',
    name: 'Form Field',
    category: 'forms',
    summary: 'Wraps a form control (input, select, …) with a floating label, hints, and errors.',
    devAppId: 'mat-form-field',
    entryPoint: 'form-field',
    hasOverviewGuide: true,
  },
  {
    id: 'grid-list',
    name: 'Grid List',
    category: 'layout',
    summary: 'A 2-dimensional grid layout of tiles.',
    devAppId: 'mat-grid-list',
    entryPoint: 'grid-list',
  },
  {
    id: 'icon',
    name: 'Icon',
    category: 'buttons',
    summary: 'Renders an icon from an icon font, ligature, SVG, or custom icon set.',
    devAppId: 'mat-icon',
    entryPoint: 'icon',
  },
  {
    id: 'input',
    name: 'Input',
    category: 'forms',
    summary: 'The native `<input>`/`<textarea>` control used inside `<MatFormField>`.',
    devAppId: 'mat-form-field',
    entryPoint: 'input',
    hasOverviewGuide: true,
  },
  {
    id: 'list',
    name: 'List',
    category: 'layout',
    summary: 'Presents rows of items, including navigation and action lists.',
    devAppId: 'mat-list',
    entryPoint: 'list',
  },
  {
    id: 'menu',
    name: 'Menu',
    category: 'navigation',
    summary: 'A floating panel of choices, opened from a trigger element.',
    devAppId: 'mat-menu',
    entryPoint: 'menu',
  },
  {
    id: 'paginator',
    name: 'Paginator',
    category: 'data-table',
    summary: 'Controls for paging through a collection of data.',
    devAppId: 'mat-paginator',
    entryPoint: 'paginator',
  },
  {
    id: 'progress-bar',
    name: 'Progress Bar',
    category: 'buttons',
    summary: 'A horizontal bar showing the progress of an operation, determinate or not.',
    devAppId: 'mat-progress-bar',
    entryPoint: 'progress-bar',
  },
  {
    id: 'progress-spinner',
    name: 'Progress Spinner',
    category: 'buttons',
    summary: 'A circular spinner showing the progress of an operation, determinate or not.',
    devAppId: 'mat-progress-spinner',
    entryPoint: 'progress-spinner',
  },
  {
    id: 'radio',
    name: 'Radio Button',
    category: 'forms',
    summary: 'A single selection from a set of mutually exclusive options.',
    devAppId: 'mat-radio',
    entryPoint: 'radio',
  },
  {
    id: 'select',
    name: 'Select',
    category: 'forms',
    summary: 'A Material-styled dropdown select control, usable inside a `<MatFormField>`.',
    devAppId: 'mat-select',
    entryPoint: 'select',
    hasOverviewGuide: true,
  },
  {
    id: 'sidenav',
    name: 'Sidenav',
    category: 'navigation',
    summary: 'A collapsible side content area, next to or over the main content.',
    devAppId: 'mat-sidenav',
    entryPoint: 'sidenav',
  },
  {
    id: 'slide-toggle',
    name: 'Slide Toggle',
    category: 'forms',
    summary: 'An on/off control, like a switch.',
    devAppId: 'mat-slide-toggle',
    entryPoint: 'slide-toggle',
  },
  {
    id: 'slider',
    name: 'Slider',
    category: 'forms',
    summary: 'Lets the user select a value (or range) from a given range by dragging a thumb.',
    devAppId: 'mat-slider',
    entryPoint: 'slider',
  },
  {
    id: 'snack-bar',
    name: 'Snack Bar',
    category: 'popups',
    summary: 'A brief, transient message displayed at the edge of the screen.',
    devAppId: 'mat-snack-bar',
    entryPoint: 'snack-bar',
  },
  {
    id: 'sort',
    name: 'Sort Header',
    category: 'data-table',
    summary: 'Adds sortable column headers to a table.',
    devAppId: 'mat-sort',
    entryPoint: 'sort',
  },
  {
    id: 'stepper',
    name: 'Stepper',
    category: 'navigation',
    summary: 'Guides a user through a sequence of numbered steps.',
    devAppId: 'mat-stepper',
    entryPoint: 'stepper',
  },
  {
    id: 'table',
    name: 'Table',
    category: 'data-table',
    summary: 'A data table with sorting, pagination, and row selection, built on the CDK table.',
    devAppId: 'mat-table',
    entryPoint: 'table',
  },
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'navigation',
    summary: 'Organizes content into separate views, one visible at a time.',
    devAppId: 'mat-tabs',
    entryPoint: 'tabs',
  },
  {
    id: 'timepicker',
    name: 'Timepicker',
    category: 'forms',
    summary: 'A dropdown-backed input for picking a time of day.',
    devAppId: 'mat-timepicker',
    entryPoint: 'timepicker',
  },
  {
    id: 'toolbar',
    name: 'Toolbar',
    category: 'navigation',
    summary: "A container for a page's or section's title, navigation, and actions.",
    devAppId: 'mat-toolbar',
    entryPoint: 'toolbar',
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'popups',
    summary: 'A short, descriptive label shown on hover, focus, or long-press.',
    devAppId: 'mat-tooltip',
    entryPoint: 'tooltip',
  },
  {
    id: 'tree',
    name: 'Tree',
    category: 'layout',
    summary: 'A hierarchical list, flat or nested, with optional expand/collapse.',
    devAppId: 'mat-tree',
    entryPoint: 'tree',
  },
];

export function getComponent(id: string): ComponentEntry | undefined {
  return COMPONENTS.find(c => c.id === id);
}

export function componentsByCategory(categoryId: string): ComponentEntry[] {
  return COMPONENTS.filter(c => c.category === categoryId);
}
