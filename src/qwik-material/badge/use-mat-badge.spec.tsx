import {describe, it, expect} from 'vitest';
import {component$, type JSXOutput} from '@qwik.dev/core';
import {createDOM} from '@qwik.dev/core/testing';
import {
  matBadge,
  useMatBadge,
  useMatBadgeProvider,
  type MatBadgeConfig,
  type MatBadgeHook,
  type UseMatBadgeProps,
} from './public-api';

interface HostProps {
  badge: UseMatBadgeProps;
  config?: MatBadgeConfig;
}

/** Renders a badge host from `useMatBadge`, under a MAT_BADGE_CONFIG provider when given one. */
const UseMatBadgeHost = component$<HostProps>(props => {
  if (props.config) useMatBadgeProvider(props.config);
  return <BadgeHost badge={useMatBadge(props.badge)} />;
});

/** Renders a badge host from `matBadge`, passing it the config directly. */
const MatBadgeHost = component$<HostProps>(props => (
  <BadgeHost badge={matBadge(props.badge, props.config)} />
));

const BadgeHost = component$<{badge: MatBadgeHook}>(props => (
  <span {...props.badge.hostProps}>{props.badge.content}</span>
));

/** A badge host's markup — ids are numbered per call, so normalized. */
async function markup(host: JSXOutput): Promise<string> {
  const {render, screen} = await createDOM();
  await render(host);
  const el = screen.querySelector('.mat-badge') as HTMLElement;
  return el.outerHTML.replace(/(cdk-describedby-message-|mat-badge-content-)\d+/g, '$1N');
}

const CASES: UseMatBadgeProps[] = [
  {content: '4'},
  {content: 8, color: 'warn', position: 'below before', size: 'large', overlap: false},
  {content: '  ', hidden: true, disabled: true},
  {content: '15', description: 'Notifications'},
  {content: '15', description: 'Notifications', interactive: false},
];

describe('matBadge', () => {
  it('needs no component context — a static render function can call it', () => {
    const badge = matBadge({content: '4'});
    expect(badge.hostProps.class).toEqual([
      'mat-badge',
      'mat-badge-overlap',
      'mat-badge-above',
      'mat-badge-after',
      'mat-badge-medium',
    ]);
    expect(badge.content).toBeDefined();
  });

  it('takes the config `useMatBadge` reads from MAT_BADGE_CONFIG as an argument', () => {
    const badge = matBadge(
      {content: '4'},
      {position: 'below before', size: 'small', overlap: false},
    );
    expect(badge.hostProps.class).toEqual([
      'mat-badge',
      'mat-badge-below',
      'mat-badge-before',
      'mat-badge-small',
    ]);
  });

  for (const props of CASES) {
    it(`renders what useMatBadge renders for ${JSON.stringify(props)}`, async () => {
      expect(await markup(<MatBadgeHost badge={props} />)).toBe(
        await markup(<UseMatBadgeHost badge={props} />),
      );
    });
  }

  it('renders what useMatBadge renders under a MAT_BADGE_CONFIG provider', async () => {
    const config: MatBadgeConfig = {position: 'below', size: 'large', overlap: false};
    expect(await markup(<MatBadgeHost badge={{content: '3'}} config={config} />)).toBe(
      await markup(<UseMatBadgeHost badge={{content: '3'}} config={config} />),
    );
  });
});
