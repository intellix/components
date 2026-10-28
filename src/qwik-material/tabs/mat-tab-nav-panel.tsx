import {component$, Slot, useSignal} from '@builder.io/qwik';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';

export interface MatTabNavPanelProps {
  id?: string;
  /** `MatTabNavPanel._activeTabId` — the id of the active link, set by
   *  whichever `<MatTabNav>` this panel is wired to (via its `tabPanelId`
   *  prop matching this panel's `id`). The consumer threads it through
   *  directly rather than via an injected back-reference, since Qwik has no
   *  `[tabPanel]`-style template-variable injection. */
  activeTabId?: string;
  class?: string | ReadonlyArray<string>;
}

/** Qwik port of `MatTabNavPanel` (`tab-nav-bar.ts`). */
export const MatTabNavPanel = component$<MatTabNavPanelProps>(props => {
  const idGen = useIdGenerator();
  const autoId = useSignal(() => idGen.getId('mat-tab-nav-panel-'));
  const id = props.id ?? autoId.value;

  return (
    <mat-tab-nav-panel
      id={id}
      class={['mat-mdc-tab-nav-panel', props.class].filter(Boolean) as string[]}
      role="tabpanel"
      aria-labelledby={props.activeTabId}
    >
      <Slot />
    </mat-tab-nav-panel>
  );
});
