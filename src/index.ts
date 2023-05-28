import type { ExpressServerTimingTracker } from './types';

export { createServerTimingMiddleware } from './server-timing.middleware';

export type {
  ExpressServerTimingMiddlewareFactory,
  ExpressServerTimingMiddleware,
  ExpressServerTimingMiddlewareProps,
  ExpressServerTimingTracker,
  ExpressServerTimingMetric,
} from './types';

declare global {
  namespace Express {
    export interface Request {
      serverTiming: ExpressServerTimingTracker;
    }
  }
}
