import {describe, it, expect, vi} from 'vitest';
import {component$, jsx} from '@builder.io/qwik';
import {createMatBottomSheetService, type MatBottomSheetService} from './mat-bottom-sheet';
import type {MatBottomSheetRef} from './mat-bottom-sheet-ref';
import {MARK_CLOSED, MARK_OPENED, REGISTER_ANIMATION_HANDLERS} from './mat-bottom-sheet-ref';

const StubBody = component$<{msg?: string}>(() => jsx('div', {}, 'stub'));

function makeStubCdk() {
  const disposed: string[] = [];
  const detached: string[] = [];
  let idSeq = 0;
  return {
    disposed,
    detached,
    open<C, D, R>(_c: any, _props: any, _cfg: any) {
      const id = `stub-cdk-${idSeq++}`;
      return {
        id,
        dispose() {
          disposed.push(id);
        },
        detachBackdrop() {
          detached.push(id);
        },
      };
    },
  };
}

function makeService(defaults: Partial<any> = {}): {
  service: MatBottomSheetService;
  registry: {openedRef: any};
  cdk: ReturnType<typeof makeStubCdk>;
} {
  const registry: {openedRef: any} = {openedRef: null};
  const cdk = makeStubCdk();
  const service = createMatBottomSheetService({cdk, defaults, registry});
  return {service, registry, cdk};
}

/** Simulates the container: wires enter()/exit() straight to MARK_OPENED/MARK_CLOSED. */
function wireInstantAnimation(ref: MatBottomSheetRef) {
  ref[REGISTER_ANIMATION_HANDLERS]({
    enter: () => ref[MARK_OPENED](),
    exit: () => ref[MARK_CLOSED](),
  });
}

describe('createMatBottomSheetService', () => {
  it('open() returns a MatBottomSheetRef with an id', () => {
    const {service} = makeService();
    const ref = service.open(StubBody);
    expect(ref).not.toBeNull();
    expect(ref!.id).toBeTruthy();
  });

  it('open() tracks the ref as the currently-opened sheet', () => {
    const {service, registry} = makeService();
    const ref = service.open(StubBody);
    expect(registry.openedRef).toBe(ref);
  });

  it('config passed to open() overrides defaults', () => {
    const {service} = makeService({hasBackdrop: false});
    const ref = service.open(StubBody, {hasBackdrop: true})!;
    expect(ref.config.hasBackdrop).toBe(true);
  });

  it('dismiss(result) resolves afterDismissed with the result after MARK_CLOSED', async () => {
    const {service} = makeService();
    const ref = service.open<any, unknown, string>(StubBody)!;
    wireInstantAnimation(ref);
    service.dismiss('closed-result');
    await expect(ref.afterDismissed).resolves.toBe('closed-result');
  });

  it('dismiss() disposes the underlying overlay once the exit animation finishes', async () => {
    const {service, cdk} = makeService();
    const ref = service.open(StubBody)!;
    wireInstantAnimation(ref);
    service.dismiss();
    await ref.afterDismissed;
    expect(cdk.disposed).toHaveLength(1);
  });

  it('clears the registry once the sheet is dismissed', async () => {
    const {service, registry} = makeService();
    const ref = service.open(StubBody)!;
    wireInstantAnimation(ref);
    service.dismiss();
    await ref.afterDismissed;
    expect(registry.openedRef).toBeNull();
  });

  it('opening a second sheet dismisses the first (replace flow)', async () => {
    const {service, registry} = makeService();
    const first = service.open(StubBody)!;
    const firstExit = vi.fn(() => first[MARK_CLOSED]());
    first[REGISTER_ANIMATION_HANDLERS]({enter: () => first[MARK_OPENED](), exit: firstExit});

    const second = service.open(StubBody)!;
    const secondEnter = vi.fn();
    second[REGISTER_ANIMATION_HANDLERS]({enter: secondEnter, exit: () => second[MARK_CLOSED]()});

    // open() dismisses the previous sheet synchronously.
    expect(firstExit).toHaveBeenCalledTimes(1);
    await first.afterDismissed;
    // ...and only enters the new one once the first has fully finished exiting.
    expect(secondEnter).toHaveBeenCalledTimes(1);
    expect(registry.openedRef).toBe(second);
  });

  it('does not enter the second sheet before the first has finished exiting', () => {
    const {service} = makeService();
    const first = service.open(StubBody)!;
    // No animation handlers registered on `first` — its exit() never "finishes".

    const second = service.open(StubBody)!;
    const secondEnter = vi.fn();
    second[REGISTER_ANIMATION_HANDLERS]({enter: secondEnter, exit: () => {}});

    expect(secondEnter).not.toHaveBeenCalled();
  });
});
