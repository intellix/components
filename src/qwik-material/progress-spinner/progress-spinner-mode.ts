/**
 * MatProgressSpinner mode. Verbatim port of upstream's ProgressSpinnerMode
 * (src/material/progress-spinner/progress-spinner.ts:23).
 *
 *   determinate  — value-driven arc via stroke-dasharray/stroke-dashoffset
 *   indeterminate — continuous rotation via CSS keyframes, aria-valuenow omitted
 */
export type MatProgressSpinnerMode = 'determinate' | 'indeterminate';
