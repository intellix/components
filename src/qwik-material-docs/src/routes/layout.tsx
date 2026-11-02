import {component$, Slot} from '@qwik.dev/core';
import SiteHeader from '../components/site-header';
import SiteFooter from '../components/site-footer';

export default component$(() => (
  <>
    <SiteHeader />
    <Slot />
    <SiteFooter />
  </>
));
