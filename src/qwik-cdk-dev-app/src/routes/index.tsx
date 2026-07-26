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
    </main>
  );
});
