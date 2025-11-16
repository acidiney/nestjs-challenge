# ADR-006 — Sentry Integration for Error Monitoring and Performance

## Context

Centralized error monitoring and performance insight is required across the API. The solution must integrate with NestJS, avoid committing secrets, and support environment-based sampling.

## Decision

- Use the official Sentry NestJS SDK (`@sentry/nestjs`) with optional profiling (`@sentry/profiling-node`).
- Initialize Sentry before any module loads via `src/instrument.ts` and import it first in `src/main.ts`.
- Register `SentryModule.forRoot()` and a global error filter (`SentryGlobalFilter`) via `APP_FILTER` to capture unexpected errors.
- Drive configuration via environment variables with sensible defaults for development vs. production.
- Keep `HttpException` derivatives as control flow by default; add targeted capture later if needed.

### Environment Variables

- `SENTRY_DSN` — DSN from Sentry project (required).

## Consequences — Positive

- Centralized visibility into unhandled errors and performance traces.
- Minimal, idiomatic NestJS integration using the official SDK.

## Consequences — Negative

- Additional dependencies and minor overhead when tracing/profiling is enabled.
- Requires operational management of DSN and sampling configuration.

## Alternatives Considered

- `@sentry/node` with custom filters/interceptors: more manual setup; official SDK reduces boilerplate.
- Other observability tools (Datadog/New Relic): viable, higher integration effort; Sentry meets current needs.

## Rollout Plan

1. Configure `SENTRY_DSN` and sampling rates per environment.
2. Deploy and verify capture by triggering a controlled error in non-production.
3. Optionally upload source maps for readable stack traces.
