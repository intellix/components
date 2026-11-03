import {
  component$,
  createContextId,
  useContext,
  useContextProvider,
  useSignal,
  type Signal,
} from '@qwik.dev/core';
import {CdkDomPortalOutlet} from '@angular-community/qwik-cdk/portal';

interface DemoContextValue {
  message: string;
}

const DEMO_CONTEXT = createContextId<DemoContextValue>('cdk-portal-demo/context');

const PortaledContent = component$(() => {
  const ctx = useContext(DEMO_CONTEXT);
  const count = useSignal(0);

  return (
    <div data-testid="portaled-content">
      <p data-testid="context-message">{ctx.message}</p>
      <button data-testid="increment" onClick$={() => count.value++}>
        Increment
      </button>
      <p data-testid="count">Count: {count.value}</p>
    </div>
  );
});

export default component$(() => {
  useContextProvider(DEMO_CONTEXT, {message: 'context-value-from-ancestor'});
  const targetRef: Signal<Element | undefined> = useSignal<Element>();
  const showOutlet = useSignal(true);

  return (
    <>
      <div data-parity-root>
        <div data-testid="target-container" ref={targetRef} />
        {showOutlet.value && (
          <CdkDomPortalOutlet target={targetRef}>
            <PortaledContent />
          </CdkDomPortalOutlet>
        )}
        <button data-testid="toggle-outlet" onClick$={() => (showOutlet.value = !showOutlet.value)}>
          Toggle outlet
        </button>
        <p data-testid="other-content">Other page content, re-rendered alongside the toggle</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
