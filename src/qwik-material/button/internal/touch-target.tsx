/**
 * The `<span class="mat-mdc-button-touch-target">` element that MDC uses to
 * enlarge the hit area of icon buttons to the minimum 48x48 recommended by
 * Material accessibility guidelines. Upstream button.html line 24.
 * Stateless — CSS drives sizing.
 *
 * A plain (inline) function component, not a `component$`: it has no state of its own, and a
 * `component$` boundary costs every button its own vnode data and serialized state (render QRL,
 * props, a render subscription) for a static span.
 */
export const TouchTarget = () => <span class="mat-mdc-button-touch-target" />;
