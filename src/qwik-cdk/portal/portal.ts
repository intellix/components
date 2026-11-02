import type {Component} from '@qwik.dev/core';

export interface Portal<P> {
  Component: Component<P>;
  props: P;
}
