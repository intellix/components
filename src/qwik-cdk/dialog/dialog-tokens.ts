// src/qwik-cdk/dialog/dialog-tokens.ts
import {createContextId} from '@qwik.dev/core';
import type {ScrollStrategy} from '../overlay/scroll/scroll-strategy';
import type {DialogConfig} from './dialog-config';

export const DIALOG_DATA = createContextId<unknown>('qwik-cdk/dialog-data');
export const DEFAULT_DIALOG_CONFIG = createContextId<Partial<DialogConfig>>(
  'qwik-cdk/dialog-default-config',
);
export const DIALOG_SCROLL_STRATEGY = createContextId<() => ScrollStrategy>(
  'qwik-cdk/dialog-scroll-strategy',
);
