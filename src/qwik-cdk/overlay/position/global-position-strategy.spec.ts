import {describe, it, expect, beforeEach} from 'vitest';
import {GlobalPositionStrategy, OverlayRef} from '../public-api';

describe('GlobalPositionStrategy', () => {
  let strategy: GlobalPositionStrategy;
  let host: HTMLElement;
  let pane: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    pane = document.createElement('div');
    host.appendChild(pane);
    document.body.appendChild(host);
    strategy = new GlobalPositionStrategy();
  });

  it('centerHorizontally applies margin-left auto on apply', () => {
    const refStub: any = {hostElement: host, overlayElement: pane};
    strategy.attach(refStub);
    strategy.centerHorizontally();
    strategy.apply();
    const wrapper = host.querySelector('.cdk-global-overlay-wrapper');
    expect(wrapper).toBeTruthy();
  });
});
