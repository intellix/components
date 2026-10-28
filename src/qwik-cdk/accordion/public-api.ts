// Public API for @angular-community/qwik-cdk/accordion.
// Qwik port of src/cdk/accordion/* (CdkAccordion + CdkAccordionItem).

export type {
  CdkAccordionState,
  CdkAccordionOpenedBroadcast,
  CdkAccordionOpenCloseAllBroadcast,
} from './accordion-state';
export {CDK_ACCORDION_STATE, CDK_ACCORDION_STATE_DEFAULTS} from './accordion-state';

export {
  useCdkAccordion,
  type UseCdkAccordionOptions,
  type CdkAccordionApi,
} from './use-cdk-accordion';

export {
  useCdkAccordionItem,
  type UseCdkAccordionItemProps,
  type CdkAccordionItemApi,
} from './use-cdk-accordion-item';
