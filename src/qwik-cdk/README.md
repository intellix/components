# @angular-community/qwik-cdk

Qwik port of [@angular/cdk](https://github.com/angular/components/tree/main/src/cdk).

**Status:** in development. First port: Dialog + foundation. See
[../../docs/superpowers/specs/2026-06-24-qwik-cdk-dialog-port-design.md](../../docs/superpowers/specs/2026-06-24-qwik-cdk-dialog-port-design.md).

## Upstream version

Targets **`@angular/cdk@21.2.14`** (git tag `v21.2.14`, commit
`8fe4d6a8ffcf`), rebaselined 2026-11-02 (see [SYNC.md](./SYNC.md)).

## Qwik version

Requires **Qwik v2** (`@qwik.dev/core` `>=2.0.0-rc.4`, a peer dependency; developed and tested
against `2.0.0-rc.4`). Upgraded from Qwik 1.x on 2026-11-01. For apps coming from Qwik 1:

- Import from `@qwik.dev/core` (and `@qwik.dev/router` instead of `@builder.io/qwik-city`); run
  `qwik migrate-v2` for your own code — see https://next.qwik.dev/docs/upgrade/.
- The public API of this package didn't change in the upgrade. Behavioural fixes made for v2
  (focus traps, overlay teardown, handler forwarding on host components, ...) are recorded in each
  entry point's `SYNC.md` under "Qwik v2".

