import onHeaders from 'on-headers';
import { createServerTimingTracker } from './utils';

const serverTimingNamespace = 'serverTiming';
const serverTimingHeader = 'Server-Timing';

export const writeServerTimingHeaders = (serverTimingTracker, res) => () => {
  const metrics = serverTimingTracker.getSnapshot({
    end: true,
  });

  const serverTimingHeaders = metrics.map((metric) => {
    const serverTimingHeaderValue = [
      metric.name,
      `dur=${metric.duration}`,
      metric.description ? `desc=${metric.description}` : '',
    ]
      .filter((value) => !!value)
      .join('; ');

    return serverTimingHeaderValue;
  });

  const existingServerTimingHeader = res.getHeader(serverTimingHeader);

  if (existingServerTimingHeader) {
    serverTimingHeaders.unshift(existingServerTimingHeader);
  }

  const serverTimingHeaderValue = serverTimingHeaders.join(', ');

  res.set({
    [serverTimingHeader]: serverTimingHeaderValue,
  });
};

/**
 *
 * @param {Object} options
 * @param {String} [options.namespace] - server timing tracker namespace to be injected into req
 * @param {Boolean|Function} [options.emitHeaders] - if server timing header should be written
 * @param {Object} [options.meta] - any global meta to be aligned with all metrics tracked
 * @param {Function} [options.beforeEmit] - function to be called before headers are sent
 */
const serverTiming = (options = {}) => (req, res, next) => {
  const {
    namespace = serverTimingNamespace,
    emitHeaders,
    meta,
  } = options;

  const tracker = createServerTimingTracker({
    meta,
  });
  req[namespace] = tracker;

  const shouldWriteHeaders = emitHeaders === true
    || ((typeof emitHeaders === 'function') && (emitHeaders(req) === true));

  if (shouldWriteHeaders) {
    onHeaders(res, writeServerTimingHeaders(tracker, res));
  }

  next();
};

export default serverTiming;
