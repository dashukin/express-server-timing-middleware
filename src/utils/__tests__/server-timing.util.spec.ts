import type { ExpressServerTimingsData, ServerTimingMetric } from '../../types';
import {
  isValidServerTimingLabel,
  isPlainObject,
  convertHRToMilliseconds,
  createMetric,
  startServerTiming,
  endServerTiming,
  getServerTimingsSnapshot,
} from '../server-timing.utils';

describe('server-timing.util', () => {
  describe('isValidServerTimingLabel', () => {
    const validTimingLabels = ['non empty string'];

    validTimingLabels.forEach((label) => {
      it(`should return true for label ${label}`, () => {
        expect(isValidServerTimingLabel(label)).toBe(true);
      });
    });

    const invalidTimingLabels = ['', ' ', 0, 1, [], {}, function () {}, NaN, null];

    invalidTimingLabels.forEach((label) => {
      it(`should return false for label ${label}`, () => {
        expect(isValidServerTimingLabel(label)).toBe(false);
      });
    });
  });

  describe('isPlainObject', () => {
    const validTypes = [{}];

    validTypes.forEach((value) => {
      it(`should return true for value ${value}`, () => {
        expect(isPlainObject(value)).toBe(true);
      });
    });

    const invalidTypes = ['', null, 0, 1, [], function () {}];

    invalidTypes.forEach((value) => {
      it(`should return false for value ${value}`, () => {
        expect(isPlainObject(value)).toBe(false);
      });
    });
  });

  describe('convertHRToMilliseconds', () => {
    it('should convert process.hrtime result values to ms', () => {
      const mockSeconds = 1;
      const mockNanoseconds = 5 * 1e9;
      const data: number[] = [mockSeconds, mockNanoseconds];
      const expected = (1 * 1e9 + mockNanoseconds) / 1e6;

      expect(convertHRToMilliseconds(data)).toBe(expected);
    });
  });

  describe('createMetric', () => {
    const mockName = 'mock-name';
    const mockDescription = 'mock-description';
    it('should create metric object', () => {
      const expected = {
        start: [expect.any(Number), expect.any(Number)],
        duration: undefined,
        complete: false,
        name: mockName,
        description: mockDescription,
      };

      expect(
        createMetric({
          name: mockName,
          description: mockDescription,
        }),
      ).toEqual(expected);
    });
  });

  describe('server timing data', () => {
    let mockServerTimigData: ExpressServerTimingsData;

    beforeEach(() => {
      mockServerTimigData = new Map();
    });

    describe('startServerTiming', () => {
      const mockName = 'mock-name';
      const expected = {
        start: [expect.any(Number), expect.any(Number)],
        duration: undefined,
        complete: false,
        name: mockName,
        description: '',
      };

      it('should set metric to map under given name', () => {
        const startServerTimingHandler = startServerTiming(mockServerTimigData);

        startServerTimingHandler(mockName);
        expect(mockServerTimigData.get(mockName)).toEqual(expected);
      });

      it('should set metric to map under given name', () => {
        const mockDescription = 'mock-description';
        const startServerTimingHandler = startServerTiming(mockServerTimigData);

        startServerTimingHandler(mockName, mockDescription);
        const expectedWithGlobalAndLocalData = {
          ...expected,
          description: mockDescription,
        };
        expect(mockServerTimigData.get(mockName)).toEqual(expectedWithGlobalAndLocalData);
      });

      it('should not set metric to map when name has not valid type', () => {
        const startServerTimingHandler = startServerTiming(mockServerTimigData);

        startServerTimingHandler('random-name');
        expect(mockServerTimigData.size).toBe(1);
      });
    });

    describe('endServerTiming', () => {
      it('should set complete flag to true to the metric stored under the given name', () => {
        const mockName = 'mock-name';
        const startServerTimingHandler = startServerTiming(mockServerTimigData);
        const endServerTimingHandler = endServerTiming(mockServerTimigData);

        startServerTimingHandler(mockName);

        const metric: ServerTimingMetric = mockServerTimigData.get(mockName)!;
        expect(metric.complete).toBe(false);
        endServerTimingHandler(mockName);
        expect(metric.complete).toBe(true);
      });

      it('should set duration for the metric stored under the given name', () => {
        const mockName = 'mock-name';
        const startServerTimingHandler = startServerTiming(mockServerTimigData);
        const endServerTimingHandler = endServerTiming(mockServerTimigData);

        startServerTimingHandler(mockName);

        const metric: ServerTimingMetric = mockServerTimigData.get(mockName)!;
        expect(metric.duration).toBeUndefined();
        endServerTimingHandler(mockName);
        expect(metric.duration).toEqual(expect.any(Number));
      });

      it('should do nothing when not valid name is passed', () => {
        const endServerTimingHandler = endServerTiming(mockServerTimigData);
        endServerTimingHandler(`${Math.random()}`);
      });

      it('should do nothing when no metric is found under given name', () => {
        const mockName = 'mock-name';
        const mockNonExistingName = 'non-existing-name';
        const startServerTimingHandler = startServerTiming(mockServerTimigData);
        const endServerTimingHandler = endServerTiming(mockServerTimigData);

        startServerTimingHandler(mockName);
        endServerTimingHandler(mockNonExistingName);
      });
    });

    describe('getServerTimingsSnapshot', () => {
      it('should return list of metrics with duration value set to all uncomplete ones', () => {
        const mockNames = ['mock-name1', 'mock-name2'];

        mockNames.forEach((name) => {
          mockServerTimigData.set(name, {
            start: [0, 123],
            duration: undefined,
            complete: false,
            name,
            description: name,
          });
        });

        const getServerTimingsSnapshotHandler = getServerTimingsSnapshot(mockServerTimigData);
        const expected = mockNames.map((name) => ({
          start: [0, 123],
          duration: expect.any(Number),
          complete: false,
          name,
          description: name,
        }));

        expect(getServerTimingsSnapshotHandler()).toEqual(expected);
      });

      it('should return list of metrics with duration value and complete set to all uncomplete ones', () => {
        const mockNames = ['mock-name1', 'mock-name2'];

        mockNames.forEach((name) => {
          mockServerTimigData.set(name, {
            start: [0, 123],
            duration: undefined,
            complete: false,
            name,
            description: name,
          });
        });

        const getServerTimingsSnapshotHandler = getServerTimingsSnapshot(mockServerTimigData);
        const expected = mockNames.map((name) => ({
          start: [0, 123],
          duration: expect.any(Number),
          complete: true,
          name,
          description: name,
        }));

        expect(getServerTimingsSnapshotHandler({ end: true })).toEqual(expected);
      });
    });
  });
});
