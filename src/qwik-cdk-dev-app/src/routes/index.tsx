import {component$, $, useContext} from '@builder.io/qwik';
import {useDialog, DIALOG_DATA} from '@angular-community/qwik-cdk/dialog';

const Body = component$(() => {
  const data = useContext(DIALOG_DATA) as {msg: string};
  return <p>{data.msg}</p>;
});

export default component$(() => {
  const dialog = useDialog();
  return (
    <main>
      <h1>qwik-cdk dev-app</h1>
      <button
        onClick$={$(async () => {
          await dialog.open$(Body, {data: {msg: 'hello'}, hasBackdrop: true});
        })}
      >
        open dialog
      </button>
      <section>
        <h2>Dialogs</h2>
        <ul>
          <li>
            <a href="/mat-dialog/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-dialog/aria-label/">aria-label</a>
          </li>
          <li>
            <a href="/mat-dialog/aria-labelledby/">aria-labelledby</a>
          </li>
          <li>
            <a href="/mat-dialog/aria-describedby/">aria-describedby</a>
          </li>
          <li>
            <a href="/mat-dialog/role-alertdialog/">role-alertdialog</a>
          </li>
          <li>
            <a href="/mat-dialog/disable-close/">disable-close</a>
          </li>
          <li>
            <a href="/mat-dialog/close-on-backdrop/">close-on-backdrop</a>
          </li>
          <li>
            <a href="/mat-dialog/close-on-escape/">close-on-escape</a>
          </li>
          <li>
            <a href="/mat-dialog/panel-class/">panel-class</a>
          </li>
          <li>
            <a href="/mat-dialog/has-actions/">has-actions</a>
          </li>
          <li>
            <a href="/mat-dialog/restore-focus/">restore-focus</a>
          </li>
          <li>
            <a href="/mat-dialog/close-with-result/">close-with-result</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Buttons</h2>
        <ul>
          <li>
            <a href="/mat-button/text/">text</a>
          </li>
          <li>
            <a href="/mat-button/filled/">filled</a>
          </li>
          <li>
            <a href="/mat-button/elevated/">elevated</a>
          </li>
          <li>
            <a href="/mat-button/outlined/">outlined</a>
          </li>
          <li>
            <a href="/mat-button/tonal/">tonal</a>
          </li>
          <li>
            <a href="/mat-button/text-link/">text-link</a>
          </li>
          <li>
            <a href="/mat-button/filled-link/">filled-link</a>
          </li>
          <li>
            <a href="/mat-button/disabled/">disabled</a>
          </li>
          <li>
            <a href="/mat-button/disabled-interactive/">disabled-interactive</a>
          </li>
          <li>
            <a href="/mat-button/disabled-interactive-only/">disabled-interactive-only</a>
          </li>
          <li>
            <a href="/mat-button/color-primary/">color-primary</a>
          </li>
          <li>
            <a href="/mat-button/color-accent/">color-accent</a>
          </li>
          <li>
            <a href="/mat-button/color-warn/">color-warn</a>
          </li>
          <li>
            <a href="/mat-button/icon-button/">icon-button</a>
          </li>
          <li>
            <a href="/mat-button/fab/">fab</a>
          </li>
          <li>
            <a href="/mat-button/fab-extended/">fab-extended</a>
          </li>
          <li>
            <a href="/mat-button/mini-fab/">mini-fab</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Cards</h2>
        <ul>
          <li>
            <a href="/mat-card/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-card/outlined/">outlined</a>
          </li>
          <li>
            <a href="/mat-card/filled/">filled</a>
          </li>
          <li>
            <a href="/mat-card/with-header/">with-header</a>
          </li>
          <li>
            <a href="/mat-card/with-actions-start/">with-actions-start</a>
          </li>
          <li>
            <a href="/mat-card/with-actions-end/">with-actions-end</a>
          </li>
          <li>
            <a href="/mat-card/with-image/">with-image</a>
          </li>
          <li>
            <a href="/mat-card/with-footer/">with-footer</a>
          </li>
          <li>
            <a href="/mat-card/title-group/">title-group</a>
          </li>
          <li>
            <a href="/mat-card/full-composed/">full-composed</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Toolbars</h2>
        <ul>
          <li>
            <a href="/mat-toolbar/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-toolbar/color-primary/">color-primary</a>
          </li>
          <li>
            <a href="/mat-toolbar/color-accent/">color-accent</a>
          </li>
          <li>
            <a href="/mat-toolbar/color-warn/">color-warn</a>
          </li>
          <li>
            <a href="/mat-toolbar/multiple-rows/">multiple-rows</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Badges</h2>
        <ul>
          <li>
            <a href="/mat-badge/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-badge/colors/">colors</a>
          </li>
          <li>
            <a href="/mat-badge/sizes/">sizes</a>
          </li>
          <li>
            <a href="/mat-badge/positions/">positions</a>
          </li>
          <li>
            <a href="/mat-badge/no-overlap/">no-overlap</a>
          </li>
          <li>
            <a href="/mat-badge/hidden/">hidden</a>
          </li>
          <li>
            <a href="/mat-badge/disabled/">disabled</a>
          </li>
          <li>
            <a href="/mat-badge/description/">description</a>
          </li>
          <li>
            <a href="/mat-badge/empty-content/">empty-content</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Icons</h2>
        <ul>
          <li>
            <a href="/mat-icon/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-icon/font-icon/">font-icon</a>
          </li>
          <li>
            <a href="/mat-icon/font-set/">font-set</a>
          </li>
          <li>
            <a href="/mat-icon/svg-literal/">svg-literal</a>
          </li>
          <li>
            <a href="/mat-icon/svg-named/">svg-named</a>
          </li>
          <li>
            <a href="/mat-icon/colors/">colors</a>
          </li>
          <li>
            <a href="/mat-icon/inline/">inline</a>
          </li>
          <li>
            <a href="/mat-icon/aria-labeled/">aria-labeled</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Progress bars</h2>
        <ul>
          <li>
            <a href="/mat-progress-bar/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-progress-bar/determinate/">determinate</a>
          </li>
          <li>
            <a href="/mat-progress-bar/indeterminate/">indeterminate</a>
          </li>
          <li>
            <a href="/mat-progress-bar/buffer/">buffer</a>
          </li>
          <li>
            <a href="/mat-progress-bar/query/">query</a>
          </li>
          <li>
            <a href="/mat-progress-bar/colors/">colors</a>
          </li>
          <li>
            <a href="/mat-progress-bar/animation-end/">animation-end</a>
          </li>
          <li>
            <a href="/mat-progress-bar/aria-labeled/">aria-labeled</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Progress spinners</h2>
        <ul>
          <li>
            <a href="/mat-progress-spinner/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-progress-spinner/determinate/">determinate</a>
          </li>
          <li>
            <a href="/mat-progress-spinner/indeterminate/">indeterminate</a>
          </li>
          <li>
            <a href="/mat-progress-spinner/mat-spinner-alias/">mat-spinner-alias</a>
          </li>
          <li>
            <a href="/mat-progress-spinner/colors/">colors</a>
          </li>
          <li>
            <a href="/mat-progress-spinner/custom-diameter/">custom-diameter</a>
          </li>
          <li>
            <a href="/mat-progress-spinner/custom-stroke/">custom-stroke</a>
          </li>
          <li>
            <a href="/mat-progress-spinner/aria-labeled/">aria-labeled</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Dividers</h2>
        <ul>
          <li>
            <a href="/mat-divider/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-divider/vertical/">vertical</a>
          </li>
          <li>
            <a href="/mat-divider/inset/">inset</a>
          </li>
          <li>
            <a href="/mat-divider/vertical-inset/">vertical-inset</a>
          </li>
          <li>
            <a href="/mat-divider/aria-labeled/">aria-labeled</a>
          </li>
          <li>
            <a href="/mat-divider/list-context/">list-context</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Grid lists</h2>
        <ul>
          <li>
            <a href="/mat-grid-list/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-grid-list/ratio/">ratio</a>
          </li>
          <li>
            <a href="/mat-grid-list/fit/">fit</a>
          </li>
          <li>
            <a href="/mat-grid-list/spanning/">spanning</a>
          </li>
          <li>
            <a href="/mat-grid-list/ratio-spanning/">ratio-spanning</a>
          </li>
          <li>
            <a href="/mat-grid-list/gutter/">gutter</a>
          </li>
          <li>
            <a href="/mat-grid-list/aria-labeled/">aria-labeled</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Lists</h2>
        <ul>
          <li>
            <a href="/mat-list/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-list/two-line/">two-line</a>
          </li>
          <li>
            <a href="/mat-list/three-line/">three-line</a>
          </li>
          <li>
            <a href="/mat-list/avatar/">avatar</a>
          </li>
          <li>
            <a href="/mat-list/icon-meta/">icon-meta</a>
          </li>
          <li>
            <a href="/mat-list/nav/">nav</a>
          </li>
          <li>
            <a href="/mat-list/action/">action</a>
          </li>
          <li>
            <a href="/mat-list/with-subheader/">with-subheader</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Button toggles</h2>
        <ul>
          <li>
            <a href="/mat-button-toggle/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-button-toggle/multi/">multi</a>
          </li>
          <li>
            <a href="/mat-button-toggle/disabled-group/">disabled-group</a>
          </li>
          <li>
            <a href="/mat-button-toggle/disabled-individual/">disabled-individual</a>
          </li>
          <li>
            <a href="/mat-button-toggle/preselected/">preselected</a>
          </li>
          <li>
            <a href="/mat-button-toggle/form-name/">form-name</a>
          </li>
          <li>
            <a href="/mat-button-toggle/standalone/">standalone</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Expansion panels</h2>
        <ul>
          <li>
            <a href="/mat-expansion/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-expansion/initially-expanded/">initially-expanded</a>
          </li>
          <li>
            <a href="/mat-expansion/disabled/">disabled</a>
          </li>
          <li>
            <a href="/mat-expansion/hide-toggle/">hide-toggle</a>
          </li>
          <li>
            <a href="/mat-expansion/toggle-position-before/">toggle-position-before</a>
          </li>
          <li>
            <a href="/mat-expansion/header-heights/">header-heights</a>
          </li>
          <li>
            <a href="/mat-expansion/action-row/">action-row</a>
          </li>
          <li>
            <a href="/mat-expansion/lazy-content/">lazy-content</a>
          </li>
          <li>
            <a href="/mat-expansion/accordion-single/">accordion-single</a>
          </li>
          <li>
            <a href="/mat-expansion/accordion-multi/">accordion-multi</a>
          </li>
          <li>
            <a href="/mat-expansion/accordion-flat/">accordion-flat</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Sliders</h2>
        <ul>
          <li>
            <a href="/mat-slider/basic/">basic</a>
          </li>
          <li>
            <a href="/mat-slider/initial-value/">initial-value</a>
          </li>
          <li>
            <a href="/mat-slider/min-max-step/">min-max-step</a>
          </li>
          <li>
            <a href="/mat-slider/discrete/">discrete</a>
          </li>
          <li>
            <a href="/mat-slider/tick-marks/">tick-marks</a>
          </li>
          <li>
            <a href="/mat-slider/display-with/">display-with</a>
          </li>
          <li>
            <a href="/mat-slider/disabled/">disabled</a>
          </li>
          <li>
            <a href="/mat-slider/range/">range</a>
          </li>
          <li>
            <a href="/mat-slider/colors/">colors</a>
          </li>
        </ul>
      </section>
      <section>
        <h2>Select</h2>
        <ul>
          <li>
            <a href="/mat-select/fill-basic/">fill-basic</a>
          </li>
          <li>
            <a href="/mat-select/outline-basic/">outline-basic</a>
          </li>
          <li>
            <a href="/mat-select/preselected-value/">preselected-value</a>
          </li>
          <li>
            <a href="/mat-select/placeholder/">placeholder</a>
          </li>
          <li>
            <a href="/mat-select/multiple/">multiple</a>
          </li>
          <li>
            <a href="/mat-select/optgroups/">optgroups</a>
          </li>
          <li>
            <a href="/mat-select/disabled/">disabled</a>
          </li>
          <li>
            <a href="/mat-select/required-error-state/">required-error-state</a>
          </li>
          <li>
            <a href="/mat-select/panel-class/">panel-class</a>
          </li>
          <li>
            <a href="/mat-select/custom-trigger/">custom-trigger</a>
          </li>
        </ul>
      </section>
    </main>
  );
});
