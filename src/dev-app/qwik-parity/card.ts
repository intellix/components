import {Component} from '@angular/core';
import {MatCardModule} from '@angular/material/card';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/mat-card/<name>/index.tsx.
// Only the subtree inside [data-parity-root] is compared. Inputs use [prop]
// bindings: a static attribute input (appearance="outlined", align="end") is also
// echoed onto the host element by Angular, which a Qwik component cannot
// distinguish from a prop.

@Component({
  template: `
    <div data-parity-root>
      <mat-card>
        <mat-card-title>Basic card</mat-card-title>
        <mat-card-subtitle>Raised appearance by default</mat-card-subtitle>
        <mat-card-content>
          <p>
            The default appearance is 'raised'. This card demonstrates the container plus three
            text-only children.
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  imports: [MatCardModule],
})
export class CardBasic {}

@Component({
  template: `
    <div data-parity-root>
      <mat-card [appearance]="'outlined'">
        <mat-card-title>Outlined card</mat-card-title>
        <mat-card-content>Outlined appearance — border instead of shadow.</mat-card-content>
      </mat-card>
    </div>
  `,
  imports: [MatCardModule],
})
export class CardOutlined {}

@Component({
  template: `
    <div data-parity-root>
      <mat-card [appearance]="'filled'">
        <mat-card-title>Filled card</mat-card-title>
        <mat-card-content>
          Filled appearance — subtle tinted background, no shadow, no border.
        </mat-card-content>
      </mat-card>
    </div>
  `,
  imports: [MatCardModule],
})
export class CardFilled {}

@Component({
  template: `
    <div data-parity-root>
      <mat-card>
        <mat-card-header>
          <img mat-card-avatar src="https://placehold.co/40x40" alt="Avatar" />
          <mat-card-title>With header</mat-card-title>
          <mat-card-subtitle>Avatar + title + subtitle</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          Header uses q:slot="avatar" and q:slot="text" for structured projection.
        </mat-card-content>
      </mat-card>
    </div>
  `,
  imports: [MatCardModule],
})
export class CardWithHeader {}

@Component({
  template: `
    <div data-parity-root>
      <mat-card>
        <img mat-card-image src="https://placehold.co/600x200" alt="Cover" />
        <mat-card-title>With image</mat-card-title>
        <mat-card-content>
          MatCardImage renders an &lt;img&gt; with the mat-mdc-card-image + mdc-card__media
          classes.
        </mat-card-content>
      </mat-card>
    </div>
  `,
  imports: [MatCardModule],
})
export class CardWithImage {}

@Component({
  template: `
    <div data-parity-root>
      <mat-card>
        <mat-card-header>
          <img mat-card-avatar src="https://placehold.co/40x40" alt="User" />
          <mat-card-title>Full composed card</mat-card-title>
          <mat-card-subtitle>Header + image + content + actions</mat-card-subtitle>
        </mat-card-header>
        <img mat-card-image src="https://placehold.co/600x200" alt="Cover" />
        <mat-card-content>
          <p>
            A realistic composition: avatar-headed card with a cover image, body copy, and an
            actions row at the bottom.
          </p>
        </mat-card-content>
        <mat-card-actions [align]="'end'">
          <button type="button">Dismiss</button>
          <button type="button">Open</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  imports: [MatCardModule],
})
export class CardFullComposed {}

@Component({
  template: `
    <div data-parity-root>
      <mat-card>
        <mat-card-title-group>
          <mat-card-title>Title group</mat-card-title>
          <mat-card-subtitle>Title + subtitle + trailing image</mat-card-subtitle>
          <img mat-card-image src="https://placehold.co/80x80" alt="Icon" />
        </mat-card-title-group>
        <mat-card-content>MatCardTitleGroup uses q:slot="text" and q:slot="image".</mat-card-content>
      </mat-card>
    </div>
  `,
  imports: [MatCardModule],
})
export class CardTitleGroup {}

@Component({
  template: `
    <div data-parity-root>
      <mat-card>
        <mat-card-title>With footer</mat-card-title>
        <mat-card-content>Card with a footer element below the content.</mat-card-content>
        <mat-card-footer>Footer text</mat-card-footer>
      </mat-card>
    </div>
  `,
  imports: [MatCardModule],
})
export class CardWithFooter {}

@Component({
  template: `
    <div data-parity-root>
      <mat-card>
        <mat-card-title>Actions align=start (default)</mat-card-title>
        <mat-card-content>Actions row aligned to the start.</mat-card-content>
        <mat-card-actions>
          <button type="button">Action 1</button>
          <button type="button">Action 2</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  imports: [MatCardModule],
})
export class CardWithActionsStart {}

@Component({
  template: `
    <div data-parity-root>
      <mat-card>
        <mat-card-title>Actions align=end</mat-card-title>
        <mat-card-content>Actions row aligned to the end.</mat-card-content>
        <mat-card-actions [align]="'end'">
          <button type="button">Cancel</button>
          <button type="button">Confirm</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  imports: [MatCardModule],
})
export class CardWithActionsEnd {}

export const CARD_SCENARIOS = {
  'basic': CardBasic,
  'outlined': CardOutlined,
  'filled': CardFilled,
  'with-header': CardWithHeader,
  'with-image': CardWithImage,
  'full-composed': CardFullComposed,
  'title-group': CardTitleGroup,
  'with-footer': CardWithFooter,
  'with-actions-start': CardWithActionsStart,
  'with-actions-end': CardWithActionsEnd,
};
