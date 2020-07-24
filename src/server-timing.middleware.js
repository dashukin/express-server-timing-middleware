import onHeaders from 'on-headers';
import { createServerTimingTracker } from './utils';

const serverTimingNamespace = 'serverTiming';
const serverTimingHeader = 'Server-Timing';

export const writeServerTimingHeaders = (serverTimingTracker, res) => () => {
  const metrics = serverTimingTracker.getSnapshot({
    end: true,
  });

  const serverTimingHeaders = metrics.map((metric) => {
    const description = metric.description ? `desc="${metric.name}: ${metric.description}"` : ''
    const serverTimingHeaderValue = [
      metric.name,
      `dur=${metric.duration}`,
      description,
    ]
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
 * @param {Function} [options.beforeEmit] - function to be called before headers are sent
 */
const serverTiming = (options = {}) => (req, res, next) => {
  const {
    namespace = serverTimingNamespace,
    writeHeaders,
    meta,
  } = options;

  const tracker = createServerTimingTracker({
    meta,
  });
  req[namespace] = tracker;

  const shouldWriteHeaders = writeHeaders === true
    || ((typeof writeHeaders === 'function') && (writeHeaders(req) === true));

  if (shouldWriteHeaders) {
    onHeaders(res, writeServerTimingHeaders(tracker, res));
  }

  next();
};

export default serverTiming;
