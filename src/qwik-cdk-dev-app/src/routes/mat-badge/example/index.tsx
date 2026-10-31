import {component$, useSignal, useStyles$, type JSXOutput} from '@builder.io/qwik';
import {createIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {MatBadge} from '@angular-community/qwik-material/badge';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatIcon} from '@angular-community/qwik-material/icon';
import styles from './example.css?inline';

// Port of src/components-examples/material/badge/badge-overview
// (badge-overview-example.html/.ts/.css) — material.angular.dev's "Badge
// overview" example.
//
// Two of its five badges decorate an element that's itself a qwik-material
// component (`<button matButton matBadge>`, `<mat-icon matBadge>`) rather
// than a plain tag — `<MatBadge as="…">` only renders raw span/div/button/a
// hosts (see badge/SYNC.md item 7: "the `as` prop is a closed enum"), so it
// can't be the one rendering MatButton's or MatIcon's own internal markup.
// Ported here by computing MatBadge's class ladder + `.mat-badge-content`
// span manually (mirrors mat-badge.tsx's own logic for exactly the features
// this example exercises: content, position, hidden — not overlap/size/
// color/disabled/description, all left at their defaults here) and handing
// them to the new `trailingContent` prop both `<MatButton>` and `<MatIcon>`
// gained for this (see button/SYNC.md item 14, icon/SYNC.md item 15) —
// appended as the host's real last child, exactly where upstream's
// directive appends it.
//
// `badgeDecoration()` deliberately does NOT take a `hidden` flag: Qwik's
// optimizer only wraps a JSX prop expression in a reactive getter when it
// can see a `.value` read directly inside THAT expression's own syntax —
// reading a signal `.value` one level removed, as a plain function
// PARAMETER, and using the function's return value in the prop, compiles
// but silently stops being reactive (confirmed empirically: the exact same
// `hidden.value`-derived class list reacted correctly inlined in the `class`
// expression below, and never updated the DOM when computed inside this
// function instead, even though the function's OWN return value visibly
// changed on every re-render). So the `hidden` class is always merged in at
// the call site, not inside this helper.
const idGen = createIdGenerator();

interface BadgeDecoration {
  class: string[];
  content: JSXOutput;
}

function badgeDecoration(opts: {
  content: string;
  position?: 'above after' | 'above before' | 'below after' | 'below before' | 'before';
}): BadgeDecoration {
  const position = opts.position ?? 'above after';
  const isAbove = !position.includes('below');
  const isAfter = !position.includes('before');
  return {
    class: [
      'mat-badge',
      'mat-badge-overlap',
      isAbove ? 'mat-badge-above' : 'mat-badge-below',
      isAfter ? 'mat-badge-after' : 'mat-badge-before',
      'mat-badge-medium',
    ],
    content: (
      <span
        id={idGen.getId('mat-badge-content-')}
        class="mat-badge-content mat-badge-active"
        aria-hidden="true"
      >
        {opts.content}
      </span>
    ),
  };
}

export default component$(() => {
  useStyles$(styles);
  const hidden = useSignal(false);

  const actionBadge = badgeDecoration({content: '8', position: 'before'});
  const hideBadge = badgeDecoration({content: '7'});
  const iconBadge = badgeDecoration({content: '15'});

  return (
    <>
      <div data-parity-root>
        <badge-overview-example>
          <MatBadge as="div" class="demo-section" content="4" overlap={false}>
            Text with a badge
          </MatBadge>

          <MatBadge as="div" class="demo-section" content="1" size="small">
            Text with small badge
          </MatBadge>
          <MatBadge as="div" class="demo-section" content="1" size="large">
            Text with large badge
          </MatBadge>

          <div class="demo-section">
            Button with a badge on the left
            <MatButton
              appearance="elevated"
              class={actionBadge.class}
              trailingContent={actionBadge.content}
            >
              Action
            </MatButton>
          </div>

          <div class="demo-section">
            Button toggles badge visibility
            <MatButton
              appearance="elevated"
              class={[...hideBadge.class, hidden.value && 'mat-badge-hidden'].filter(Boolean)}
              trailingContent={hideBadge.content}
              onClick$={() => {
                hidden.value = !hidden.value;
              }}
            >
              Hide
            </MatButton>
          </div>

          <div class="demo-section">
            Icon with a badge
            <MatIcon class={iconBadge.class} trailingContent={iconBadge.content}>
              home
            </MatIcon>
            {/* Include text description of the icon's meaning for screen-readers */}
            <span class="cdk-visually-hidden">
              Example with a home icon with overlaid badge showing the number 15
            </span>
          </div>
        </badge-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
