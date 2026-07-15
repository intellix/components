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
    </main>
  );
});
