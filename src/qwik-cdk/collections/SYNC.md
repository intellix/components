# collections — Angular CDK sync status

Added 2026-11-03 (blockers/cdk expansion — new entry point).
Last synced from upstream: `v21.2.14` (`8fe4d6a8ffcf`).

## Ported items

### `Subscribable<T>` (new — not upstream)

- Destination: `subscribable.ts`
- This entry point's RxJS replacement, used everywhere upstream has an `Observable<T>`
  (`DataSource.connect()`, `CollectionViewer.viewChange`) — qwik-cdk has no RxJS dependency.
  `{ subscribe(observer): () => void }`. `subscribableOf(value)` mirrors RxJS's `of(value)`
  (and a `BehaviorSubject`'s replay-on-subscribe): it calls the observer synchronously, once,
  the instant `subscribe()` is called — `ArrayDataSource` depends on this for correct SSR
  output (the snapshot must be available in the SAME synchronous render pass that calls
  `connect().subscribe(...)`, no microtask delay).

### `SelectionModel<T>`

- Source: `src/cdk/collections/selection-model.ts`
- Destination: `selection-model.ts`
- Changes from CDK original:
  - `createSelectionModel(multiple, initiallySelectedValues, emitChanges, compareWith)` factory
    (object literal + closures) instead of a `class` — same convention as
    `createFocusTrap`/`createFocusKeyManager` in `qwik-cdk/a11y`. Constructor **signature**
    (positional args, same defaults) kept identical to upstream so the upstream
    `selection.spec.ts` test suite ports with only `new SelectionModel(...)` →
    `createSelectionModel(...)` and `model.changed.subscribe(spy)` → `model.onChange(spy)`
    mechanical substitutions (see `selection-model.spec.ts`, ported almost verbatim).
  - `changed` (an RxJS `Subject<SelectionChange<T>>`) replaced by `onChange(listener):
    () => void` callback registration — same convention as `ListKeyManager`'s
    `onChange`/`onTabOut` in `qwik-cdk/a11y/key-manager`.
  - Every other method (`select`/`deselect`/`setSelection`/`toggle`/`clear`/`isSelected`/
    `isEmpty`/`hasValue`/`sort`/`isMultipleSelection`) and the `compareWith`-based
    "deselect if comparable" behavior ported verbatim (same algorithm, same edge cases —
    "don't emit for preselected values", "sort without triggering the `selected` getter
    first", etc).
  - `getMultipleValuesInSingleSelectionError()` kept as a plain exported function; the
    `ngDevMode` dev-mode gate around the throw (`typeof ngDevMode === 'undefined' ||
    ngDevMode`) dropped — this port always throws, same "no dev-mode throws" simplification
    used elsewhere in this project (e.g. `form-field/SYNC.md`'s deviation #1).
  - **Qwik-component integration (`use-selection-model.ts`, new — not upstream):**
    `createSelectionModel()`'s return value has methods (closures) — not safe to store
    inside a `useSignal`/`useStore` (an object with methods can't survive the SSR→resume
    serialization boundary; see `data-source.ts`'s doc comment for the general rule).
    `useSelectionModel()` instead keeps ONLY the plain, serializable selected-values array
    in a `Signal<readonly T[]>`, and `selectValue`/`deselectValue`/`toggleSelectionValue`/
    `setSelectionValues`/`clearSelection` are plain module functions that construct an
    EPHEMERAL `createSelectionModel()` instance on demand (never stored anywhere) to reuse
    the exact selection algorithm, then write the result back into the signal. Call these
    directly from inside your own `$()` handler body — same "logic in module functions, not
    inside a stored instance" shape as everything else class-shaped in this package.
  - **No existing consumer migrated to this.** `qwik-material/button-toggle`, `radio`,
    `select`, and the `table-selection` example each independently hand-rolled single/multi
    selection with plain signals/`Set`s before this entry point existed (confirmed via repo
    search 2026-11-03 — see each one's own `SYNC.md` for its specific deviation write-up).
    Retrofitting any of them onto `useSelectionModel()` is a follow-up, not done here — each
    is a settled, parity-tested component and switching its selection engine is a
    behavior-risk change out of scope for *adding* this entry point.

### `DataSource<T>` / `isDataSource()`

- Source: `src/cdk/collections/data-source.ts`
- Destination: `data-source.ts`
- Changes from CDK original:
  - `connect()` returns `Subscribable<readonly T[]>` instead of `Observable<readonly T[]>`.
  - `isDataSource()`'s `!(value instanceof ConnectableObservable)` exclusion dropped — no
    RxJS, so no `ConnectableObservable` to exclude; the `typeof value.connect === 'function'`
    duck-type check alone is upstream's actual detection mechanism anyway (the
    `ConnectableObservable` exclusion exists only because of an internal-to-Google app RxJS
    edge case noted in the upstream comment, irrelevant here).
  - Kept as an `abstract class` (not narrowed to a plain interface) specifically so a
    consumer can `extends DataSource<T>` exactly like upstream.
  - Added `createNoopCollectionViewer()` — upstream never ships a reusable no-op viewer;
    every caller route in this port that doesn't do its own virtualization
    (`useDataSourceConnection()`) needs SOME `CollectionViewer` to pass to `connect()`/
    `disconnect()`, so a trivial one (a `viewChange` that never emits) is provided rather than
    inventing an ad hoc shape at each call site.
  - **Not safe to store in a `Signal`/`Store`/context value** — see its own doc comment.
    `useDataSourceConnection()` is the Qwik-safe consumption path (a `QRL` factory,
    constructing a fresh instance per environment, instead of accepting a pre-built
    instance as a prop/signal value).

### `ArrayDataSource<T>`

- Source: `src/cdk/collections/array-data-source.ts`
- Destination: `array-data-source.ts`
- Changes from CDK original: `isObservable`/`of` (RxJS) → `isSubscribable`/`subscribableOf`
  (this entry point's own). Otherwise verbatim.

### `UniqueSelectionDispatcher`

- Source: `src/cdk/collections/unique-selection-dispatcher.ts`
- Destination: `unique-selection-dispatcher.ts`
- Changes from CDK original: `createUniqueSelectionDispatcher()` factory instead of an
  `@Injectable({providedIn: 'root'})` singleton `class` — no Angular DI, no implicit global
  singleton (construct one and share it via a Qwik context if you need the same
  cross-subtree coordination upstream's root injector gives you for free). `ngOnDestroy` →
  `destroy()`, called explicitly by whoever owns the instance.
- **Ported for API completeness only — no consumer in this port.** `qwik-material/radio`'s
  standalone-radio cross-talk and `qwik-cdk/accordion`'s auto-close both solve the same
  underlying problem differently (see `use-selection-model.ts`'s doc comment and
  `accordion/SYNC.md`'s "`UniqueSelectionDispatcher`" deviation for the prior art and why a
  global name-keyed dispatcher wasn't the right fit for either).

### `useDataSourceConnection()` (new — not upstream, this port's `CdkTable.dataSource` equivalent)

- Destination: `use-data-source-connection.ts`
- Upstream's `CdkTable.dataSource` setter accepts `DataSource<T> | Observable<T[]> | T[]`
  directly as an `@Input()`, switching internally on which shape it got. This port's
  `qwik-material/table`'s `MatTable` has an existing, already-parity-tested `rows: T[]`
  prop (confirmed via repo search 2026-11-03 — no `dataSource` concept exists anywhere in
  `qwik-cdk/table`/`qwik-material/table` yet) that this entry point deliberately does **not**
  modify. Instead, `useDataSourceConnection(factory: QRL<() => DataSource<T> | readonly T[]>):
  Signal<readonly T[]>` bridges a `DataSource` into a plain rows array BY COMPOSITION:
  ```tsx
  const rows = useDataSourceConnection($(() => new ArrayDataSource(allRows)));
  return <MatTable columns={columns} displayedColumns={ids} rows={toTableRows(rows.value)} />;
  ```
  - **Why a `QRL` factory, not an already-constructed `DataSource` prop:** a `DataSource`
    instance has methods — passing one directly as a component prop/signal value hits the
    exact serialization pitfall `data-source.ts`'s doc comment describes. A factory lets the
    hook construct a FRESH instance in each environment that needs one (SSR render pass,
    client resume) — the same way Angular SSR + hydration never actually carries a
    `DataSource` *instance* across the wire either, only the rendered view has to agree.
  - **SSR behavior:** one `useTask$` (no `track()`, so it runs exactly once, in whichever
    environment renders this component first) calls the factory, and if the result is a
    `DataSource`, calls `connect()` and takes only what's emitted SYNCHRONOUSLY before
    immediately unsubscribing + disconnecting — covers `ArrayDataSource` and any other
    source that replays its current value on subscribe. An async-only source (e.g. one
    backed by a fetch) renders an empty array during SSR, exactly like Angular SSR would for
    the same `DataSource` shape (no special-casing either side of this port for that case).
  - **Client-side live updates:** a separate `useVisibleTask$` (guaranteed to run on the
    client regardless of SSR, unlike the untracked task above) calls the factory AGAIN —
    deliberately never reusing the instance the SSR task constructed — and keeps a live
    `subscribe()` open for the component's lifetime, writing every new emission into the
    returned `Signal`.
  - **Not yet exercised by a real consumer/parity scenario** — `qwik-material/table` itself
    is untouched by this change (zero risk to its existing scenarios); wiring an actual
    example/dev-app page through this hook is a documented follow-up, not required for the
    bridging mechanism itself to exist and be unit-tested (see `use-data-source-connection.spec.ts`
    — tests the SSR-snapshot + plain-array paths directly against a fake `DataSource`;
    the `useVisibleTask$` live-update path isn't exercised by vitest, same documented
    limitation as every other Qwik-hook spec in this package — `createDOM()` isn't reliable
    in this package's vitest environment, see `accordion/accordion-hooks.spec.ts`'s note).

## Intentionally not ported

- `CollectionViewer.viewChange`'s real virtual-scroll range-reporting consumer
  (`cdk-virtual-scroll-viewport`) — virtual scroll is out of scope for this port (see
  `qwik-cdk/scrolling/SYNC.md`). `CollectionViewer`/`ListRange` are ported as plain types for
  `DataSource.connect()`'s signature parity only.
- `dispose-view-repeater-strategy.ts` / `recycle-view-repeater-strategy.ts` / `view-repeater.ts`
  / `tree-adapter.ts` — upstream internals that back `*cdkVirtualFor`'s view-recycling and
  `CdkTree`'s flattened-node adapter. No Qwik structural-directive equivalent exists (no
  `*ngFor`-style view containers), and no consumer in this port needs them; `qwik-cdk/tree`
  already has its own tree-flattening approach (see `tree/SYNC.md`) that doesn't go through
  `tree-adapter.ts`.

## Open deviations

- `compareWith` on `useSelectionModel()`'s options is a plain function, like upstream — but
  if a consumer needs to call `selectValue`/`toggleSelectionValue`/etc. from inside a `$()`
  handler that's a DIFFERENT QRL than the one holding `compareWith` in scope, capturing a
  plain (non-`$()`) closure across that QRL boundary can fail to serialize. Every realistic
  consumer (primitive values, or reference-equality objects — no `compareWith` at all) is
  unaffected; documented here rather than solved, since no current scenario needs a custom
  `compareWith` AND cross-QRL capture at once.
