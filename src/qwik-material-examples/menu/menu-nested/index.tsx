import {$, component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {
  MatMenu,
  MatMenuItem,
  createMatMenu,
  useMatMenuTrigger,
} from '@angular-community/qwik-material/menu';

// Qwik port of material.angular.dev's `menu-nested` docs example — see
// src/components-examples/material/menu/menu-nested/menu-nested-example.{ts,html}. Rendered
// unmodified by the Angular dev-app at /qwik-parity/examples/menu-nested (the generic
// `examples/:exampleId` route). The root trigger stacks `matButton` AND `[matMenuTriggerFor]`
// (directive-hooks pattern, same as `menu-overview`); each sub-menu-opening item uses
// `<MatMenuItem menu={...}>` directly (its own built-in nested-trigger prop — see
// src/qwik-cdk-dev-app/src/routes/mat-menu/nested/index.tsx for the same pattern).

export default component$(() => {
  const fish = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem>Baikal oilfish</MatMenuItem>
        <MatMenuItem>Bala shark</MatMenuItem>
        <MatMenuItem>Ballan wrasse</MatMenuItem>
        <MatMenuItem>Bamboo shark</MatMenuItem>
        <MatMenuItem>Banded killifish</MatMenuItem>
      </>
    )),
  });
  const amphibians = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem>Sonoran desert toad</MatMenuItem>
        <MatMenuItem>Western toad</MatMenuItem>
        <MatMenuItem>Arroyo toad</MatMenuItem>
        <MatMenuItem>Yosemite toad</MatMenuItem>
      </>
    )),
  });
  const reptiles = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem>Banded Day Gecko</MatMenuItem>
        <MatMenuItem>Banded Gila Monster</MatMenuItem>
        <MatMenuItem>Black Tree Monitor</MatMenuItem>
        <MatMenuItem>Blue Spiny Lizard</MatMenuItem>
        <MatMenuItem disabled>Velociraptor</MatMenuItem>
      </>
    )),
  });
  const vertebrates = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem menu={fish}>Fishes</MatMenuItem>
        <MatMenuItem menu={amphibians}>Amphibians</MatMenuItem>
        <MatMenuItem menu={reptiles}>Reptiles</MatMenuItem>
        <MatMenuItem>Birds</MatMenuItem>
        <MatMenuItem>Mammals</MatMenuItem>
      </>
    )),
  });
  const invertebrates = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem>Insects</MatMenuItem>
        <MatMenuItem>Molluscs</MatMenuItem>
        <MatMenuItem>Crustaceans</MatMenuItem>
        <MatMenuItem>Corals</MatMenuItem>
        <MatMenuItem>Arachnids</MatMenuItem>
        <MatMenuItem>Velvet worms</MatMenuItem>
        <MatMenuItem>Horseshoe crabs</MatMenuItem>
      </>
    )),
  });
  const animals = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem menu={vertebrates}>Vertebrates</MatMenuItem>
        <MatMenuItem menu={invertebrates}>Invertebrates</MatMenuItem>
      </>
    )),
  });

  const trigger = useMatMenuTrigger({menu: animals});

  return (
    <menu-nested-example>
      <MatButton {...trigger.hostProps}>Animal index</MatButton>
      <MatMenu />
      <MatMenu />
      <MatMenu />
      <MatMenu />
      <MatMenu />
      <MatMenu />
    </menu-nested-example>
  );
});
