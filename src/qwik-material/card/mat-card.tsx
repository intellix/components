import {component$, Slot, useContext} from '@builder.io/qwik';
import type {MatCardAppearance} from './card-appearance';
import {MAT_CARD_CONFIG, type MatCardConfig} from './card-config';

export interface MatCardProps {
  /** Visual appearance. Overrides the provider config. Defaults to 'raised'. */
  appearance?: MatCardAppearance;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const DEFAULTS: MatCardConfig = {appearance: 'raised'};

export const MatCard = component$<MatCardProps>(props => {
  const config = useContext(MAT_CARD_CONFIG, DEFAULTS);
  const appearance = props.appearance ?? config.appearance ?? 'raised';

  const classes = [
    'mat-mdc-card',
    'mdc-card',
    appearance === 'outlined' && 'mat-mdc-card-outlined',
    appearance === 'outlined' && 'mdc-card--outlined',
    appearance === 'filled' && 'mat-mdc-card-filled',
    appearance === 'filled' && 'mdc-card--filled',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <mat-card id={props.id} class={classes}>
      <Slot />
    </mat-card>
  );
});
