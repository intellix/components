Badges are small status descriptors for UI elements. A badge consists of a small circle,
typically containing a number or other short set of characters, that appears in proximity to
another object.

Badges must always be applied to [block-level elements][block-level].

[block-level]: https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements

<!-- example(badge-overview) -->

### Badge position
By default, the badge will be placed `above after`. The direction can be changed with the
`position` prop:

```tsx
<MatBadge as="div" content="4" position="below before">
  Text with a badge
</MatBadge>
```

The overlap of the badge in relation to its inner contents can also be defined using the
`overlap` prop. Typically, you want the badge to overlap an icon and not a text phrase. By
default it will overlap.

```tsx
<MatBadge as="div" content="4" overlap={false}>
  Text with a badge
</MatBadge>
```

### Badge sizing
The badge has 3 sizes: `small`, `medium` and `large`. By default, the badge is set to `medium`.

Badges that are `small` do not show the label text. This can be useful in contexts such as
showing there are unread notifications but not needing to show the exact amount.

You can change the size with the `size` prop:

```tsx
<MatBadge as="div" content="1" size="small">
  Text with small badge
</MatBadge>
```

### Badge visibility
The badge visibility can be toggled programmatically with the `hidden` prop.

```tsx
<MatBadge as="div" content="7" hidden={isHidden.value}>
  Text with a badge
</MatBadge>
```

### Accessibility
You must provide a meaningful description via the `description` prop. When attached to an
interactive host (`as="button"` / `as="a"`), `MatBadge` applies this description to its host via
`aria-describedby`. When attached to a non-interactive host, `MatBadge` appends a
visually-hidden, inline description element. The badge determines interactivity based on the
`as` prop, not a live DOM focusability check (see [Angular → Qwik notes](#angular-qwik-notes)).

When applying a badge to a `<MatIcon>`, it is important to know that `MatIcon` is
`aria-hidden="true"` by default. If the combination of icon and badge communicates meaningful
information, always surface this information in another way. [See the guidance on indicator
icons for more information](/components/icon/overview#accessibility).

## Angular → Qwik notes

- **`[matBadge]` directive → `<MatBadge>` component or `useMatBadge()` hook.** `<MatBadge as="div"
  | "span" | "button" | "a">` renders its own host element (upstream's directive attaches to a
  consumer-owned element instead). To put a badge on an element that's already a qwik-material
  component (a button, an icon), call `useMatBadge()` directly and spread its `hostProps`/
  `content` onto that component — see [Composing directives](/guide/composing-directives/) and
  the headline example above (the "Action"/"Hide"/icon badges).
- **`matBadgeDescription` → `description` prop.** The live `AriaDescriber`-based dedup/cleanup
  across multiple badges sharing the same description text isn't ported — each badge's
  description is independent.
- **Interactivity for the `aria-describedby`-vs-inline-span choice is derived from the `as` prop**
  (`'button' | 'a'` count as interactive), not a real `InteractivityChecker.isFocusable` DOM
  check.
- **Global defaults via a hook (`useMatBadgeProvider()`)**, not an `MAT_BADGE_CONFIG` injection token.
- **No native `disabled` passthrough.** `disabled` only toggles the visual `.mat-badge-disabled`
  class, matching upstream's own `matBadgeDisabled` (it was never a native-disabled passthrough
  upstream either).
- **Harness not ported.**
