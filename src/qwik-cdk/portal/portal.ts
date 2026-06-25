import type {Component} from '@builder.io/qwik';

export interface Portal<P> {
  Component: Component<P>;
  props: P;
}
