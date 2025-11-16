import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as dotenv from 'dotenv';

dotenv.config();

const tracesSampleRate = 0.6;
const profilesSampleRate = 0.1;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate,
  profilesSampleRate,
});

Sentry.metrics.distribution('response_time', 187.5, {
  unit: 'millisecond',
});
Sentry.metrics.gauge('memory_usage', 1024, {
  unit: 'byte',
});
