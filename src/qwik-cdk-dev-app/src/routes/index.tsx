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
    </main>
  );
});
