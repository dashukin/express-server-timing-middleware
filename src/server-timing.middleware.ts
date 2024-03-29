import onHeaders from 'on-headers';
import type { Request, Response, NextFunction } from 'express';
import type {
  ExpressServerTimingMiddlewareFactory,
  ExpressServerTimingMiddleware,
  ExpressServerTimingMiddlewareProps,
  ExpressServerTimingTracker,
  ExpressServerTimingMetric,
} from './types/server-timing-middleware.types';
import { createServerTimingTracker } from './utils';

const serverTimingNamespace = 'serverTiming';
const serverTimingHeader = 'server-timing';

export const writeServerTimingHeaders =
  (serverTimingTracker: ExpressServerTimingTracker, res: Response) => () => {
    const metrics = serverTimingTracker.getSnapshot({
      end: true,
    });

    const serverTimingHeaders = metrics.map((metric: ExpressServerTimingMetric) => {
      const description = metric.description ? `desc="${metric.name}: ${metric.description}"` : '';
      const serverTimingHeaderValue = [metric.name, `dur=${metric.duration}`, description]
        .filter((value) => !!value)
        .join(';');

      return serverTimingHeaderValue;
    });

    if (serverTimingHeaders.length) {
      res.append(serverTimingHeader, serverTimingHeaders);
    }
  };

/**
 *
 * @param {Object} options
 * @param {String} [options.namespace] - server timing tracker namespace to be injected into req
 * @param {Boolean|Function} [options.writeHeaders] - if server timing header should be written
 * @param {Object} [options.meta] - any global meta to be aligned with all metrics tracked
 */
export const createServerTimingMiddleware: ExpressServerTimingMiddlewareFactory =
  (options: ExpressServerTimingMiddlewareProps): ExpressServerTimingMiddleware =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { namespace = serverTimingNamespace, writeHeaders } = options;

      const tracker = createServerTimingTracker();
      // @ts-ignore
      req[namespace] = tracker;

      let shouldWriteHeaders = writeHeaders === true;

      if (typeof writeHeaders === 'function') {
        shouldWriteHeaders = writeHeaders(req) === true;
      }

      if (shouldWriteHeaders) {
        onHeaders(res, writeServerTimingHeaders(tracker, res));
      }

      next();
    } catch (error) {
      next();
    }
  };
