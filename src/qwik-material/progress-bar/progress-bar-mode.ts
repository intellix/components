/**
 * MatProgressBar mode. Verbatim port of upstream's ProgressBarMode
 * (src/material/progress-bar/progress-bar.ts:84).
 *
 *   determinate  — value-driven bar, no continuous animation
 *   indeterminate — continuous back-and-forth animation, aria-valuenow omitted
 *   buffer       — determinate primary + buffer bar + dotted "loading" pattern
 *   query        — visually identical to indeterminate; separate mode for CMS
 */
export type MatProgressBarMode = 'determinate' | 'indeterminate' | 'buffer' | 'query';
