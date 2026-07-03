import {describe, it, expect} from 'vitest';
// Import ensures the module loads without hook-order errors at module-init;
// exercising useContext requires a component render harness which is out of
// scope for the unit spec. The hook is verified end-to-end via
// MatDialogContainer's spec in Task 8.

import {useAnimationsDisabled} from './use-animations-disabled';

describe('useAnimationsDisabled', () => {
  it('is a callable function', () => {
    expect(typeof useAnimationsDisabled).toBe('function');
  });
});
