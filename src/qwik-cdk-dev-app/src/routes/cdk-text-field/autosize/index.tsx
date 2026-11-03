import {component$} from '@qwik.dev/core';
import {useCdkTextareaAutosize} from '@angular-community/qwik-cdk/text-field';

export default component$(() => {
  const autosize = useCdkTextareaAutosize({minRows: 2, maxRows: 4});

  return (
    <>
      <div data-parity-root>
        <textarea {...autosize.hostProps} data-testid="autosize-textarea" />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
