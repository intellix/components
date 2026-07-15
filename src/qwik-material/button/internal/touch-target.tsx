import {component$} from '@builder.io/qwik';

/**
 * The `<span class="mat-mdc-button-touch-target">` element that MDC uses to
 * enlarge the hit area of icon buttons to the minimum 48x48 recommended by
 * Material accessibility guidelines. Upstream button.html line 24.
 * Stateless — CSS drives sizing.
 */
export const TouchTarget = component$(() => <span class="mat-mdc-button-touch-target" />);
