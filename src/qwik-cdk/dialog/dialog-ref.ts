import {type Signal} from '@builder.io/qwik';
import type {OverlayRef} from '../overlay/overlay-ref';
import type {DialogConfig} from './dialog-config';
import type {FocusOrigin} from '../a11y/focus-monitor/focus-monitor';

export class DialogRef<R = unknown, C = unknown> {
  readonly id: string;
  readonly isOpen: Signal<boolean>;
  readonly componentInstance: Signal<C | null>;
  readonly closed: Promise<R | undefined>;

  private _resolveClosed!: (r: R | undefined) => void;

  constructor(
    private readonly overlayRef: OverlayRef,
    readonly config: DialogConfig<unknown, R>,
    isOpenSignal: Signal<boolean>,
    componentInstanceSignal: Signal<C | null>,
  ) {
    this.id = config.id!;
    this.isOpen = isOpenSignal;
    this.componentInstance = componentInstanceSignal;
    this.closed = new Promise<R | undefined>(resolve => {
      this._resolveClosed = resolve;
    });
  }

  close(result?: R, _options?: {focusOrigin?: FocusOrigin}): void {
    if (!this.isOpen.value) return;
    (this.isOpen as {value: boolean}).value = false;
    this.overlayRef.dispose();
    this._resolveClosed(result);
  }

  updatePosition(): void {
    this.overlayRef.updatePosition();
  }
  updateSize(width?: string | number, height?: string | number): void {
    this.overlayRef.updateSize({width, height});
  }
  addPanelClass(classes: string | string[]): void {
    this.overlayRef.addPanelClass(classes);
  }
  removePanelClass(classes: string | string[]): void {
    this.overlayRef.removePanelClass(classes);
  }
}
