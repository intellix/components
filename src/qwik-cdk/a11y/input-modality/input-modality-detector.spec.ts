import {describe, it, expect, afterEach} from 'vitest';
import {createInputModalityDetector, type InputModalityDetector} from '../public-api';

describe('InputModalityDetector', () => {
  let det: InputModalityDetector;

  afterEach(() => {
    det?.destroy();
  });

  it('initial modality is null', () => {
    det = createInputModalityDetector();
    expect(det.modality.value).toBeNull();
  });
  it('mouse event sets modality to mouse', () => {
    det = createInputModalityDetector();
    document.body.dispatchEvent(
      new MouseEvent('mousedown', {bubbles: true, buttons: 1, detail: 1}),
    );
    expect(det.modality.value).toBe('mouse');
  });
  it('keyboard event sets modality to keyboard', () => {
    det = createInputModalityDetector();
    document.body.dispatchEvent(new KeyboardEvent('keydown', {bubbles: true, key: 'Tab'}));
    expect(det.modality.value).toBe('keyboard');
  });
});
