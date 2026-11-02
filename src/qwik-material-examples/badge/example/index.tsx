import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatBadge, useMatBadge} from '@angular-community/qwik-material/badge';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatIcon} from '@angular-community/qwik-material/icon';
import styles from './example.css?inline';

// Port of src/components-examples/material/badge/badge-overview
// (badge-overview-example.html/.ts/.css) — material.angular.dev's "Badge
// overview" example.
//
// Two of its five badges decorate an element that's itself a qwik-material
// component (`<button matButton matBadge>`, `<mat-icon matBadge>`) rather
// than a plain tag — upstream stacks TWO directives on one native element,
// something `<MatBadge as="…">` (which renders its OWN host) can't do from
// the outside. Ported here with the "directive hooks" pattern
// (`qwik-material/README.md`'s "Composing directives"): `useMatBadge()`
// returns exactly what `[matBadge]` contributes — `hostProps` (classes,
// `aria-describedby`) to spread onto the host, and `content` (the
// `.mat-badge-content` span) to pass through `MatButton`/`MatIcon`'s
// `hostContent` prop, which renders it as the host's own last child, same
// position upstream's directive appends it.

export default component$(() => {
  useStyles$(styles);
  const hidden = useSignal(false);

  const actionBadge = useMatBadge({content: '8', position: 'before'});
  const hideBadge = useMatBadge({content: '7', hidden: hidden.value});
  const iconBadge = useMatBadge({content: '15'});

  return (
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
          {...actionBadge.hostProps}
          hostContent={actionBadge.content}
        >
          Action
        </MatButton>
      </div>

      <div class="demo-section">
        Button toggles badge visibility
        <MatButton
          appearance="elevated"
          {...hideBadge.hostProps}
          hostContent={hideBadge.content}
          onClick$={() => {
            hidden.value = !hidden.value;
          }}
        >
          Hide
        </MatButton>
      </div>

      <div class="demo-section">
        Icon with a badge
        <MatIcon {...iconBadge.hostProps} hostContent={iconBadge.content}>
          home
        </MatIcon>
        {/* Include text description of the icon's meaning for screen-readers */}
        <span class="cdk-visually-hidden">
          Example with a home icon with overlaid badge showing the number 15
        </span>
      </div>
    </badge-overview-example>
  );
});
