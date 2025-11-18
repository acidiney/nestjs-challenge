# ADR-001 — Push Down Record Filtering to MongoDB

## Context

In `src/api/controllers/record.controller.ts`, the `findAll` endpoint currently fetches all records from MongoDB (`this.recordModel.find().exec()`) and applies filtering in JavaScript. This approach:

- Loads the entire collection into application memory, creating latency and memory pressure.
- Bypasses database indexes and prevents efficient query execution.
- Makes pagination and sorting inefficient or error-prone.
- Couples transport/controller logic with ad-hoc query semantics.

To improve performance and maintainability in the Records API, we must leverage MongoDB’s query engine and indexes directly through Mongoose.

## Decision

Push query filtering, sorting, and pagination into MongoDB using Mongoose query APIs and appropriate indexes. Concretely:

- Replace JS-side filtering in controllers with MongoDB-side queries via Mongoose.
- Define and use indexes to support search and filtering:
  - Text index on `artist`/`album`,
  - Compound indexes for `category+price`,
  - Indexes on `format` and `price`.
- Use `lean()` and projections to reduce hydration overhead and payload size.
- Implement pagination with `skip/limit`.
- Prefer sorting by indexed fields; for text search, sort by `textScore`.
- Incrementally refactor to route query logic through a read-side repository (`RecordsReadRepository`) in the infrastructure layer to keep controllers thin and domain/application aligned.

## Implementation Sketch

### Indexing (Mongoose Schema)

Define indexes in the `RecordSchema` to support query patterns efficiently:

```ts
// src/api/schemas/record.schema.ts (to be moved under infrastructure later)
RecordSchema.index(
  { title: 'text', artist: 'text' },
  {
    weights: { title: 5, artist: 3 },
    name: 'text_title_artist',
  },
);

RecordSchema.index({ category: 1, price: 1 }, { name: 'idx_category_price' });

RecordSchema.index({ price: 1 }, { name: 'idx_price_asc' });
RecordSchema.index({ format: 1 }, { name: 'idx_format' });
RecordSchema.index({ created: -1 }, { name: 'idx_created_desc' });
RecordSchema.index({ lastModified: -1 }, { name: 'idx_lastModified_desc' });
```

Ensure indexes are created at application bootstrap:

```ts
await RecordModel.createIndexes();
```

### Controller Query Pushdown (Interim)

Rewrite the `findAll` method to query MongoDB directly. This is an interim step before moving logic behind an application use case and read-side repository.

```ts
// src/api/controllers/record.controller.ts (findAll)
import { FilterQuery } from 'mongoose';

@Get()
async findAll(
  @Query('q') q?: string,
  @Query('artist') artist?: string,
  @Query('album') album?: string,
  @Query('format') format?: RecordFormat,
  @Query('category') category?: RecordCategory,
  @Query('page') page = 1,
  @Query('pageSize') pageSize = 20,
  @Query('sort') sort: 'relevance' | 'price' | 'releasedAt' = 'relevance',
): Promise<Record[]> {
  const query: FilterQuery<Record> = {};

  if (artist) query.artist = new RegExp(artist, 'i');
  if (album) query.album = new RegExp(album, 'i');
  if (format) query.format = format;
  if (category) query.category = category;
  if (q) query.$text = { $search: q } as any;

  const projection = q
    ? { score: { $meta: 'textScore' }, artist: 1, album: 1, price: 1, qty: 1, format: 1, category: 1 }
    : { artist: 1, album: 1, price: 1, qty: 1, format: 1, category: 1 };

  let cursor = this.recordModel.find(query, projection).lean();
  if (sort === 'relevance' && q) cursor = cursor.sort({ score: { $meta: 'textScore' } });
  else if (sort === 'price') cursor = cursor.sort({ price: 1 });
  else if (sort === 'releasedAt') cursor = cursor.sort({ releasedAt: -1 });

  const results = await cursor
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize))
    .exec();

  return results as any;
}
```

Notes:

- Use `RegExp` for partial matches where text search is not applicable; prefer text search when `q` is provided.

### Read-Side Repository (Follow-up)

Introduce a `RecordsReadRepository` interface in the domain and a Mongoose implementation in infrastructure to encapsulate query logic. Controllers should depend on application use cases that call this repository.

```ts
// src/contexts/records/domain/repositories/RecordsReadRepository.ts
export type RecordSummary = Readonly<{
  id: string;
  artist: string;
  album: string;
  price: number;
  format: string;
  category: string;
}>;

export interface RecordsReadRepository {
  search(params: {
    q?: string;
    artist?: string;
    album?: string;
    format?: string;
    category?: string;
    sort?: 'relevance' | 'price' | 'releasedAt';
    page: number;
    pageSize: number;
  }): Promise<{ items: RecordSummary[]; total: number }>;
}
```

## Consequences — Positive

- Significant performance improvement by leveraging MongoDB indexes and query planner.
- Reduced application memory usage; avoids full collection scans in Node.js.
- Clear path to pagination and sorting semantics that scale.
- Enables clean separation (controller → application → repository) in the next refactor.

## Consequences — Negative

- Requires index management and potential migration scripts for existing data.
- Changes query semantics slightly (e.g., `includes` vs. case-insensitive regex vs. text search relevance). Must be documented and tested.
- Adds initial complexity to wiring repositories/use cases if the follow-up refactor is adopted fully.

## Alternatives Considered

- Keep JS-side filtering and add caching layer.
  - Rejected: Still requires reading the full dataset; cache invalidation complexity.
- Use MongoDB Aggregation Pipeline immediately for all queries.
  - Deferred: Powerful but heavier to maintain; start with indexed `find()` queries and introduce aggregation for advanced analytics.
- Integrate external search (Atlas Search/Elasticsearch) for full-text and faceted search.
  - Deferred: Operational overhead; acceptable future evolution once catalog/search becomes a primary workload.

## Rollout Plan

1. Add indexes to `RecordSchema` and run `syncIndexes()` during bootstrap.
2. Update `record.controller.ts` to push filtering into MongoDB.
3. Add pagination and sorting parameters with sensible defaults.
4. Validate via benchmarks/e2e tests on realistic dataset sizes.
5. Follow up: Introduce `RecordsReadRepository` and move query logic into infrastructure to align with DDD/Hex.
