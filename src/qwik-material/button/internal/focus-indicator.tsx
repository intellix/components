import {component$} from '@qwik.dev/core';

/**
 * The `<span class="mat-focus-indicator">` element that MDC positions via
 * `::before` for high-contrast mode indication. Upstream button.html line 22.
 * Stateless — CSS drives every visible state.
 */
export const FocusIndicator = component$(() => <span class="mat-focus-indicator" />);
