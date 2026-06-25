import {component$, Slot} from '@builder.io/qwik';
import type {Portal} from './portal';

export interface CdkPortalOutletProps<P = any> {
  portal: Portal<P> | null;
}

export const CdkPortalOutlet = component$<CdkPortalOutletProps>(props => {
  if (!props.portal) return <Slot />;
  const Comp = props.portal.Component;
  return <Comp {...(props.portal.props as any)} />;
});
