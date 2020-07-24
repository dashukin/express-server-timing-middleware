export const isValidServerTimingLabel = (label) => typeof label === 'string' && (label.trim()).length > 0;
export const isPlainObject = (o) => Object.prototype.toString.call(o).slice(8, -1) === 'Object';


/**
 *
 * @param hrData
 * @return {number}
 */
export const convertHRToMilliseconds = (hrData) => {
  const [seconds, nanoseconds] = hrData;
  const milliseconds = seconds * 1e3 + nanoseconds * 1e-6;

  return Number(milliseconds.toFixed(3))
};

/**
 * @typedef {Object} ServerTimingMetrics
 *
 * @property {Number} start
 * @property {Number|Undefined} end
 * @property {Number|Undefined} duration
 * @property {Boolean} complete
 * @property {Object} meta
 */

/**
 *
 * @param {Object} meta - optional meta data to be tracked
 * @return {ServerTimingMetrics}
 */
export const createMetric = ({ name, description, meta = {} } = {}) => ({
  start: process.hrtime(),
  duration: undefined,
  complete: false,
  name,
  description,
  meta: isPlainObject(meta) ? meta : {},
});

/**
 * @param {Map} serverTimingData
 * @param {Object} [globalMeta]
 */
export const startServerTiming = (serverTimingData, globalMeta) => (name, description, meta) => {
  if (!isValidServerTimingLabel(name)) {
    console.warn(`Wrong label format: ${name}`);
    return undefined;
  }

  const metric = createMetric({
    name,
    description,
    meta: Object.assign(
      {},
      isPlainObject(globalMeta) ? globalMeta : {},
      meta,
    ),
  });

  serverTimingData.set(name, metric);

  return undefined;
};

/**
 * @param {Map} serverTimingData
 */
export const endServerTiming = (serverTimingData) => (name) => {
  if (!isValidServerTimingLabel(name)) {
    console.warn(`Wrong name supplied for tracking: ${name}`);
    return undefined;
  }

  const metric = serverTimingData.get(name);

  if (!metric) {
    console.warn(`No metric tracked for ${name} name`);
    return undefined;
  }

  const measurement = {
    duration: convertHRToMilliseconds(process.hrtime(metric.start)),
    complete: true,
  };

  Object.assign(metric, measurement);

  return undefined;
};

/**
 * @param {Map} serverTimingData
 */
export const getServerTimingsSnapshot = (serverTimingData) => ({ end = false } = {}) => {
  const serverTimings = [];
  serverTimingData.forEach((metric) => {
    serverTimings.push(metric)
  });

  // fill uncomplete metrics with duration values
  const serverTimingsSnapshot = serverTimings
    .map((metric) => {
      if (metric.complete === false) {
        const duration = convertHRToMilliseconds(process.hrtime(metric.start));
        const completeMetricData = !end ? {} : {
          complete: true,
        };

        const fixedMetric = Object.assign({}, {
          ...metric,
          duration,
        }, completeMetricData);

        return fixedMetric;
      } else {
        return metric;
      }
    });

  return serverTimingsSnapshot;
};

export const createServerTimingTracker = (options = {}) => {
  const { meta: globalMeta } = options;
  const serverTimingData = new Map();

  return {
    start: startServerTiming(serverTimingData, globalMeta),
    end: endServerTiming(serverTimingData),
    getSnapshot: getServerTimingsSnapshot(serverTimingData),
  };
};
