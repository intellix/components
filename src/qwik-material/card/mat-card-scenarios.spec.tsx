/**
 * MatCard scenario port from src/material/card/card.spec.ts.
 *
 * Structure: (i) live sanity tests confirming every public export is
 * callable; (ii) describe.skip blocks preserving upstream `it()` names
 * for traceability, deferred to Playwright (Task 14) where real DOM
 * rendering is possible.
 *
 * Real DOM assertions (class emissions, appearance toggling, config
 * flow-through via DI) live in Task 14's Playwright specs. This file's
 * job is to (a) prove exports load without error, (b) document what
 * still needs porting when infra allows.
 *
 * NOTE: upstream `src/material/card/card.spec.ts` has only 3 `it()`
 * blocks (not the 8 originally estimated), so the skip-stub count below
 * (2 DOM-rendered + 1 Angular-only = 3) matches upstream reality rather
 * than the original brief estimate.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_CARD_CONFIG,
  MatCard,
  MatCardHeader,
  MatCardTitleGroup,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent,
  MatCardActions,
  MatCardFooter,
  MatCardImage,
  MatCardSmImage,
  MatCardMdImage,
  MatCardLgImage,
  MatCardXlImage,
  MatCardAvatar,
} from './public-api';

describe('MatCard — sanity', () => {
  it('MAT_CARD_CONFIG has the expected context id', () => {
    expect(MAT_CARD_CONFIG.id).toBe('qwik-material/card-config');
  });

  it('MatCard is exported', () => {
    expect(MatCard).toBeDefined();
    expect(typeof MatCard).toBe('function');
  });

  it('MatCardHeader is exported', () => {
    expect(MatCardHeader).toBeDefined();
    expect(typeof MatCardHeader).toBe('function');
  });

  it('MatCardTitleGroup is exported', () => {
    expect(MatCardTitleGroup).toBeDefined();
    expect(typeof MatCardTitleGroup).toBe('function');
  });

  it('MatCardTitle is exported', () => {
    expect(MatCardTitle).toBeDefined();
    expect(typeof MatCardTitle).toBe('function');
  });

  it('MatCardSubtitle is exported', () => {
    expect(MatCardSubtitle).toBeDefined();
    expect(typeof MatCardSubtitle).toBe('function');
  });

  it('MatCardContent is exported', () => {
    expect(MatCardContent).toBeDefined();
    expect(typeof MatCardContent).toBe('function');
  });

  it('MatCardActions is exported', () => {
    expect(MatCardActions).toBeDefined();
    expect(typeof MatCardActions).toBe('function');
  });

  it('MatCardFooter is exported', () => {
    expect(MatCardFooter).toBeDefined();
    expect(typeof MatCardFooter).toBe('function');
  });

  it('MatCardImage family (5 variants) is exported', () => {
    expect(MatCardImage).toBeDefined();
    expect(MatCardSmImage).toBeDefined();
    expect(MatCardMdImage).toBeDefined();
    expect(MatCardLgImage).toBeDefined();
    expect(MatCardXlImage).toBeDefined();
    [MatCardImage, MatCardSmImage, MatCardMdImage, MatCardLgImage, MatCardXlImage].forEach(c => {
      expect(typeof c).toBe('function');
    });
  });

  it('MatCardAvatar is exported', () => {
    expect(MatCardAvatar).toBeDefined();
    expect(typeof MatCardAvatar).toBe('function');
  });
});

describe.skip('MatCard DOM-rendered scenarios — deferred to Playwright Task 14', () => {
  // The following upstream `it()` names are preserved from
  // src/material/card/card.spec.ts. Real DOM assertions live in
  // src/qwik-cdk-parity-tests/specs/material-card/*.spec.ts.

  it('should default the card to the `raised` appearance', () => {});
  it('should be able to change the card appearance', () => {});
});

describe.skip('MatCard — Angular-only tests', () => {
  it('should be able to change the default card appearance using DI', () => {
    // Provider flow-through verified in Task 13 dev-app + Task 14 Playwright.
  });
});
