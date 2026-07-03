import {describe, it, expect, beforeEach} from 'vitest';
import {component$, jsx, type NoSerialize, type Signal} from '@builder.io/qwik';
import {createMatDialogService, type MatDialogService} from './mat-dialog';
import type {MatDialogRef} from './mat-dialog-ref';
import {MatDialogState, MARK_CLOSED} from './mat-dialog-ref';

const StubBody = component$<{msg?: string}>(() => jsx('div', {}, 'stub'));

function makeStubCdk() {
  const disposed: string[] = [];
  return {
    disposed,
    open<C, D, R>(_c: any, _props: any, _cfg: any) {
      let idSeq = 0;
      const id = `stub-cdk-${idSeq++}`;
      return {
        id,
        dispose() {
          disposed.push(id);
        },
        updatePosition() {},
        updateSize(_o: any) {},
        addPanelClass(_c: any) {},
        removePanelClass(_c: any) {},
      };
    },
  };
}

function makeService(defaults: Partial<any> = {}): {
  service: MatDialogService;
  openDialogs: Signal<readonly NoSerialize<MatDialogRef>[]>;
  matRefsById: Record<string, NoSerialize<MatDialogRef>>;
  cdk: ReturnType<typeof makeStubCdk>;
} {
  const openDialogs = {value: [] as readonly NoSerialize<MatDialogRef>[]} as Signal<
    readonly NoSerialize<MatDialogRef>[]
  >;
  const matRefsById: Record<string, NoSerialize<MatDialogRef>> = {};
  const cdk = makeStubCdk();
  const service = createMatDialogService({
    cdk,
    defaults,
    openDialogs,
    matRefsById,
  });
  return {service, openDialogs, matRefsById, cdk};
}

describe('createMatDialogService', () => {
  it('open() returns a MatDialogRef with an id', () => {
    const {service} = makeService({id: 'from-defaults'});
    const ref = service.open(StubBody);
    expect(ref).not.toBeNull();
    expect(ref!.id).toBe('from-defaults');
  });

  it('open() pushes into openDialogs signal', () => {
    const {service, openDialogs} = makeService({id: 'x'});
    service.open(StubBody);
    expect(openDialogs.value.length).toBe(1);
  });

  it('close(id) closes the correct dialog', async () => {
    const {service, openDialogs} = makeService();
    const refA = service.open(StubBody, {id: 'a'})!;
    const refB = service.open(StubBody, {id: 'b'})!;
    service.close('a');
    refA[MARK_CLOSED](); // simulate the container's animation-end callback
    await refA.afterClosed;
    expect(openDialogs.value.map(r => r?.id)).toEqual(['b']);
    expect(refB.state.value).toBe(MatDialogState.OPEN);
  });

  it('closeAll() closes every open dialog', async () => {
    const {service} = makeService();
    const refA = service.open(StubBody, {id: 'a'})!;
    const refB = service.open(StubBody, {id: 'b'})!;
    service.closeAll();
    expect(refA.state.value).toBe(MatDialogState.CLOSING);
    expect(refB.state.value).toBe(MatDialogState.CLOSING);
  });

  it('getDialogById() returns the ref by id or undefined', () => {
    const {service} = makeService();
    const ref = service.open(StubBody, {id: 'find-me'})!;
    expect(service.getDialogById('find-me')).toBe(ref);
    expect(service.getDialogById('not-there')).toBeUndefined();
  });

  it('config passed to open() overrides defaults', () => {
    const {service} = makeService({id: 'from-defaults', hasBackdrop: false});
    const ref = service.open(StubBody, {id: 'from-open', hasBackdrop: true})!;
    expect(ref.id).toBe('from-open');
    expect(ref.config.hasBackdrop).toBe(true);
  });

  it('close(result) resolves afterClosed with the result after MARK_CLOSED', async () => {
    const {service} = makeService();
    const ref = service.open<any, unknown, string>(StubBody, {id: 'x'})!;
    ref.close('closed-result');
    ref[MARK_CLOSED]();
    await expect(ref.afterClosed).resolves.toBe('closed-result');
  });
});
