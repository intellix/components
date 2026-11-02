`<MatCard>` is a content container for text, photos, and actions in the context of a single
subject.

<!-- example(card-overview) -->

### Basic card sections

The most basic card needs only a `<MatCard>` element with some content. However, qwik-material
provides a number of preset sections that you can use inside a `<MatCard>`:

| Component                 | Description                                                    |
|----------------------------|------------------------------------------------------------------|
| `<MatCardHeader>`          | Section anchored to the top of the card (adds padding)         |
| `<MatCardContent>`         | Primary card content (adds padding)                             |
| `<MatCardImage>`           | Card image. Stretches the image to the container width          |
| `<MatCardActions>`         | Container for buttons at the bottom of the card (adds padding)  |
| `<MatCardFooter>`          | Section anchored to the bottom of the card                      |

These components primarily serve as pre-styled content containers without any additional APIs.
However, the `align` prop on `<MatCardActions>` can be used to position the actions at the
`'start'` or `'end'` of the container.

### Card padding

The `<MatCard>` element itself does not add any padding around its content. This allows you to
customize the padding to your liking by applying padding to the elements you put in the card.

In many cases you may just want the standard padding specified in the Material Design spec. In
this case, the `<MatCardHeader>`, `<MatCardContent>`, and `<MatCardFooter>` sections can be used.

* `<MatCardContent>` adds standard padding along its sides, as well as along the top if it is the
  first element in the `<MatCard>`, and along the bottom if it is the last element in the
  `<MatCard>`.
* `<MatCardHeader>` adds standard padding along its sides and top.
* `<MatCardActions>` adds padding appropriate for the action buttons at the bottom of a card.

### Card headers

A `<MatCardHeader>` can contain any content, but there are several predefined components that
can be used to create a rich header to a card. These include:

| Component                | Description                                          |
|---------------------------|-------------------------------------------------------|
| `<MatCardTitle>`          | A title within the header                            |
| `<MatCardSubtitle>`       | A subtitle within the header                         |
| `<MatCardAvatar>`         | An image used as an avatar within the header         |

`<MatCardHeader>` projects its children into one of three named slots by `q:slot` attribute
(Qwik has no equivalent of Angular's content-projection-by-directive-type, so the slot is
explicit) — `q:slot="avatar"`, `q:slot="text"` (for the title/subtitle), and the unscoped default
slot for anything else:

```tsx
<MatCardHeader>
  <MatCardAvatar q:slot="avatar" src="..." alt="..." />
  <MatCardTitle q:slot="text">Shiba Inu</MatCardTitle>
  <MatCardSubtitle q:slot="text">Dog Breed</MatCardSubtitle>
</MatCardHeader>
```

In addition to using `<MatCardTitle>` and `<MatCardSubtitle>` directly within
`<MatCardHeader>`, they can be further nested inside a `<MatCardTitleGroup>` in order to arrange
them with a (non-avatar) image.

### Title groups

`<MatCardTitleGroup>` can be used to combine a title, subtitle, and image into a single section.
This element can contain:
* `<MatCardTitle>`
* `<MatCardSubtitle>`
* One of: `<MatCardSmImage>`, `<MatCardMdImage>`, `<MatCardLgImage>`

### Accessibility

Cards serve a wide variety of scenarios and may contain many different types of content. Due to
this flexible nature, the appropriate accessibility treatment depends on how you use `<MatCard>`.

#### Group, region, and landmarks

There are several ARIA roles that communicate that a portion of the UI represents some
semantically meaningful whole. Depending on what the content of the card means to your
application, you can apply one of [`role="group"`][role-group], [`role="region"`][role-region],
or [one of the landmark roles][aria-landmarks] to the `<MatCard>` element.

You do not need to apply a role when using a card as a purely decorative container that does not
convey a meaningful grouping of related content for a single subject. In these cases, the
content of the card should follow standard practices for document content.

#### Focus

Depending on how cards are used, it may be appropriate to apply a `tabIndex` to the `<MatCard>`
element.

* If cards are a primary mechanism through which user interacts with the application, `tabIndex={0}`
  may be appropriate.
* If attention can be sent to the card, but it's not part of the document flow, `tabIndex={-1}`
  may be appropriate.
* If the card acts as a purely decorative container, it does not need to be tabbable. In this
  case, the card content should follow normal best practices for tab order.

Always test your application to verify the behavior that works best for your users.

[role-group]: https://www.w3.org/TR/wai-aria/#group
[role-region]: https://www.w3.org/TR/wai-aria/#region
[aria-landmarks]: https://www.w3.org/TR/wai-aria/#landmark

## Angular → Qwik notes

- **Image/avatar are components that render their own `<img>`, not directives applied to a
  consumer-supplied `<img>`.** `<MatCardImage src alt />` renders
  `<img class="mat-mdc-card-image mdc-card__media" src alt />`; same for `<MatCardAvatar>` and
  the `<MatCardSmImage>`/`<MatCardMdImage>`/`<MatCardLgImage>`/`<MatCardXlImage>` title-group
  sizes. Consumers who want `<picture>` or `<video>` for card media must add the classes
  manually until a Slot-accepting variant is added.
- **`<MatCardHeader>`/`<MatCardTitleGroup>` use `q:slot` named slots** (`avatar`, `text`, `image`)
  for structured projection, shown above — upstream projects children by directive-selector type
  (`[mat-card-avatar]`, `mat-card-title`), which Qwik has no equivalent for.
- **Global defaults via `QwikMaterialProvider`**, not a `MAT_CARD_CONFIG` injection token.
- **`<MatCardActions>`'s `align` prop stays `'start' | 'end'`** — upstream marked it TODO-to-deprecate
  in favor of `actionPosition`/`actionAlignment`; this port keeps the current name for parity and
  will follow if upstream renames it.
- **Harness not ported.**
