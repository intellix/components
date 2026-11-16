import {$, component$, useSignal} from '@qwik.dev/core';
import {createDOM} from '@qwik.dev/core/testing';
import {describe, expect, it} from 'vitest';
import {MenuPanel} from './menu-panel';

/**
 * `MenuPanel`'s exit task calls `finishExit`, a QRL. When it was declared after the task, the
 * optimizer's split build read it in its temporal dead zone at render ("Cannot access 'p' before
 * initialization": the panel never opened in an app's production build), or, with this package's
 * optimizer, dropped the capture: "finishExit is not defined" once the panel closed. This renders
 * the panel and closes it through the task (`animationsDisabled`: the immediate-exit branch).
 * Fails without the fix both in a plain run and under `vitest run --mode production` (the
 * optimizer's prod transform).
 */
const Harness = component$(() => {
  const isOpen = useSignal(true);
  const exited = useSignal(false);
  return (
    <>
      <button id="close" onClick$={() => (isOpen.value = false)}>
        close
      </button>
      <output id="exited">{String(exited.value)}</output>
      <MenuPanel
        panelId="panel"
        content={<span>item</span>}
        panelClassList={[]}
        xPositionClass="after"
        yPositionClass="below"
        animationsDisabled={true}
        isOpen={isOpen}
        onPanelClick$={$(() => {})}
        onExitDone$={$(() => {
          exited.value = true;
        })}
      />
    </>
  );
});

describe('MenuPanel', () => {
  it('opens, then closes through its exit task', async () => {
    const {render, screen, userEvent} = await createDOM();
    await render(<Harness />);
    const panel = screen.querySelector('#panel')!;
    expect(panel.getAttribute('role')).toBe('menu');
    expect(panel.textContent).toBe('item');

    await userEvent('#close', 'click');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(screen.querySelector('#exited')!.textContent).toBe('true');
    expect(panel.classList.contains('mat-menu-panel-exit-animation')).toBe(true);
    expect(panel.classList.contains('mat-menu-panel-animating')).toBe(false);
  });
});
