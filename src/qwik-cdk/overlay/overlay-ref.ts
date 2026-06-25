import type {OverlayRegistry, OverlayEntry} from './overlay-registry';
import type {OverlayConfig} from './overlay-config';
import type {PositionStrategy} from './position/position-strategy';
import type {ScrollStrategy} from './scroll/scroll-strategy';

export class OverlayRef {
  private hostEl: HTMLElement | null = null;
  private paneEl: HTMLElement | null = null;

  constructor(
    private readonly registry: OverlayRegistry,
    private readonly entry: OverlayEntry,
    private readonly positionStrategy?: PositionStrategy,
    private readonly scrollStrategy?: ScrollStrategy,
  ) {
    this.positionStrategy?.attach(this);
    this.scrollStrategy?.attach(this);
  }

  /** Called by OverlayHost via the entry's onAttached$ lifecycle hook. */
  _onAttached(host: HTMLElement, pane: HTMLElement): void {
    this.hostEl = host;
    this.paneEl = pane;
    this.positionStrategy?.apply();
    this.scrollStrategy?.enable();
  }

  _onDetached(): void {
    this.scrollStrategy?.disable();
    this.positionStrategy?.detach?.();
    this.hostEl = null;
    this.paneEl = null;
  }

  get config(): OverlayConfig {
    return this.entry.config;
  }
  get hostElement(): HTMLElement | null {
    return this.hostEl;
  }
  get overlayElement(): HTMLElement | null {
    return this.paneEl;
  }

  detach(): void {
    this.entry.state.detached.value = true;
    this.registry.remove(this.entry.id);
  }

  dispose(): void {
    this.detach();
    this.positionStrategy?.dispose();
  }

  updatePosition(): void {
    this.positionStrategy?.apply();
  }

  updateSize(opts: {
    width?: string | number;
    height?: string | number;
    minWidth?: string | number;
    minHeight?: string | number;
    maxWidth?: string | number;
    maxHeight?: string | number;
  }): void {
    if (opts.width !== undefined) this.entry.state.width.value = px(opts.width);
    if (opts.height !== undefined) this.entry.state.height.value = px(opts.height);
    if (opts.minWidth !== undefined) this.entry.state.minWidth.value = px(opts.minWidth);
    if (opts.minHeight !== undefined) this.entry.state.minHeight.value = px(opts.minHeight);
    if (opts.maxWidth !== undefined) this.entry.state.maxWidth.value = px(opts.maxWidth);
    if (opts.maxHeight !== undefined) this.entry.state.maxHeight.value = px(opts.maxHeight);
  }

  addPanelClass(classes: string | string[]): void {
    const arr = Array.isArray(classes) ? classes : [classes];
    this.entry.state.panelClasses.value = [
      ...new Set([...this.entry.state.panelClasses.value, ...arr]),
    ];
  }

  removePanelClass(classes: string | string[]): void {
    const arr = Array.isArray(classes) ? classes : [classes];
    this.entry.state.panelClasses.value = this.entry.state.panelClasses.value.filter(
      c => !arr.includes(c),
    );
  }
}

function px(v: string | number): string {
  return typeof v === 'number' ? `${v}px` : v;
}
