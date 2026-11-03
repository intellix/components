import {$, component$, useSignal} from '@qwik.dev/core';
import {useCdkCopyToClipboard} from '@angular-community/qwik-cdk/clipboard';

export default component$(() => {
  const status = useSignal('idle');
  const clip = useCdkCopyToClipboard({
    text: 'Hello from qwik-cdk clipboard',
    onCopied$: $((successful: boolean) => {
      status.value = successful ? 'copied' : 'failed';
    }),
  });

  return (
    <>
      <div data-parity-root>
        <button {...clip.hostProps} data-testid="copy-button">
          Copy
        </button>
        <p data-testid="copy-status">Status: {status.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
