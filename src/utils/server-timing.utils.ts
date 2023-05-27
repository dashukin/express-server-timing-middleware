import type {
  ExpressServerTimingTracker,
  ExpressServerTimingMetric,
  ExpressServerTimingsData,
} from '../types/server-timing-middleware.types';

export const isValidServerTimingLabel = (label: unknown) => {
  return typeof label === 'string' && label.trim().length > 0;
};
export const isPlainObject = (o: any) => {
  return Object.prototype.toString.call(o).slice(8, -1) === 'Object';
};

/**
 *
 * @param hrData
 * @return {number}
 */
export const convertHRToMilliseconds = (hrData: number[]): number => {
  const [seconds, nanoseconds] = hrData;
  const milliseconds = seconds * 1e3 + nanoseconds * 1e-6;

  return Number(milliseconds.toFixed(3));
};

export const createMetric = ({
  name,
  description = '',
}: {
  name: string;
  description?: string | undefined;
}): ExpressServerTimingMetric => ({
  start: process.hrtime(),
  duration: undefined,
  complete: false,
  name,
  description,
});

/**
 * @param {Map} serverTimingData
 * @param {Object} [globalMeta]
 */
export const startServerTiming =
  (serverTimingData: ExpressServerTimingsData) =>
  (name: string, description?: string): ExpressServerTimingMetric | undefined => {
    if (!isValidServerTimingLabel(name)) {
      return undefined;
    }

    const metric = createMetric({
      name,
      description,
    });

    serverTimingData.set(name, metric);

    return undefined;
  };

/**
 * @param {Map} serverTimingData
 */
export const endServerTiming = (serverTimingData: ExpressServerTimingsData) => (name: string) => {
  if (!isValidServerTimingLabel(name)) {
    return undefined;
  }

  const metric = serverTimingData.get(name);

  if (!metric) {
    return undefined;
  }

  const measurement = {
    duration: convertHRToMilliseconds(process.hrtime(metric.start)),
    complete: true,
  };

  Object.assign(metric, measurement);

  return undefined;
};

export const getServerTimingsSnapshot =
  (serverTimingData: ExpressServerTimingsData) =>
  ({ end = false } = {}) => {
    const serverTimings: ExpressServerTimingMetric[] = [];
    serverTimingData.forEach((metric: ExpressServerTimingMetric) => {
      serverTimings.push(metric);
    });

    // fill uncomplete metrics with duration values
    const serverTimingsSnapshot = serverTimings.map((metric) => {
      if (metric.complete === false) {
        const duration = convertHRToMilliseconds(process.hrtime(metric.start));
        const completeMetricData = !end
          ? {}
          : {
              complete: true,
            };

        const fixedMetric = Object.assign(
          {},
          {
            ...metric,
            duration,
          },
          completeMetricData,
        );

        return fixedMetric;
      } else {
        return metric;
      }
    });

    return serverTimingsSnapshot;
  };

export const createServerTimingTracker = (): ExpressServerTimingTracker => {
  const serverTimingData = new Map();

  return {
    start: startServerTiming(serverTimingData),
    end: endServerTiming(serverTimingData),
    getSnapshot: getServerTimingsSnapshot(serverTimingData),
  };
};
