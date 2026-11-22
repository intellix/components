/**
 * The `<span class="mat-focus-indicator">` element that MDC positions via
 * `::before` for high-contrast mode indication. Upstream button.html line 22.
 * Stateless — CSS drives every visible state.
 *
 * A plain (inline) function component, not a `component$`: it has no state of its own, and a
 * `component$` boundary costs every button its own vnode data and serialized state (render QRL,
 * props, a render subscription) for a static span.
 */
export const FocusIndicator = () => <span class="mat-focus-indicator" />;
