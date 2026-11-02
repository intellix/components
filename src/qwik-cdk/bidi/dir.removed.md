# Not ported: dir.ts
CDK's `Dir` directive ([dir]) is a structural directive that wraps a subtree
to override its `Directionality`. Qwik has no structural directives. Consumers
pass `direction` as a prop on `<QwikCdkRoot>` (app-wide) or in a
`DialogConfig.direction` field (per-dialog).
