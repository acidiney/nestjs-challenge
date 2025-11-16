# ADR-004 — Add Cache Layer for Record Queries

## Context

The Records API’s listing endpoint (`GET /records`) performs filtered searches that can be expensive under catalog growth. Even after pushing query filtering into MongoDB per ADR-001, repeated identical reads (same query params) generate redundant load on MongoDB and increase latency.

## Decision

Introduce a Valkey-backed cache using NestJS’s `@nestjs/cache-manager` and `cache-manager`:

- Register a global cache with 300s TTL.
- Apply route-level caching to `GET /records` via an interceptor.
- Emit invalidation events on data changes and listen to them to clear cached entries.

## Implementation Sketch

- Global cache setup
  - `src/app.module.ts` registers `CacheModule` globally with a Valkey store.
- Invalidation events

  - Emit `cache.invalidate` after successful writes:
  - Listener: `src/infrastructure/cache/cache-invalidation.listener.ts` handles the event and clears the cache store.

- Error handling
  - Cache failures (store unreachable or operations failing) are swallowed in interceptor/listener; the request continues to query MongoDB without raising client-visible errors.

## TTL Strategy

- Default TTL: 300 seconds. Balances freshness with reduced repeated load for popular queries.
- TTL is set globally and reinforced per-route with `@CacheTTL(300)` for clarity.

## Testing Strategy

- Unit tests provide `CacheModule.register()` in controller specs to satisfy `CACHE_MANAGER`.
- e2e tests bypass cache via `RecordsCacheInterceptor` when `NODE_ENV === 'test'`, ensuring tests read the latest DB state without relying on event-driven invalidation.

## Consequences — Positive

- Lower latency and DB load for repeated queries.
- Simple integration using NestJS primitives; minimal controller changes.
- Clear invalidation via domain/application events preserves data freshness.

## Consequences — Negative

- Full-store reset on invalidation is broad; it trades simplicity for potential cache churn. This can be refined later with key prefixing to delete only keys related to `/records`.
- Requires running a Valkey/Redis service; adds operational dependency.

## Alternatives Considered

- No cache, rely solely on ADR-001 pushdown
  - Better than JS-side filtering but misses repeated-query optimization.
- In-memory cache (`memory` store)
  - Fast but not shared across instances; unsuitable for scale-out.
- Fine-grained key invalidation per query
  - More complex; defer until usage patterns demand it.

## Rollout Plan

1. Provision Valkey in Docker Compose (`docker-compose.yml`).
2. Configure global cache and route-level decorators.
3. Emit events from create/update/order flows and wire the listener.
4. Validate with unit and e2e tests; ensure cache bypass in tests.
5. Monitor cache hit rate and database load; consider prefixed-key invalidation if needed.
