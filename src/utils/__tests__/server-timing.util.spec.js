import {
  isValidServerTimingLabel,
  isPlainObject,
  convertHRToMilliseconds,
  createMetric,
  startServerTiming,
  endServerTiming,
  getServerTimingsSnapshot,
  createServerTimingTracker,
} from '../server-timing.util';

describe('server-timing.util', () => {
  let originalConsole;
  let mockConsoleWarn;

  beforeEach(() => {
    originalConsole = global.console;
    mockConsoleWarn = jest.fn();
    global.console = {
      warn: mockConsoleWarn,
    };
  });

  afterEach(() => {
    global.console = originalConsole;
  });

  describe('isValidServerTimingLabel', () => {
    const validTimingLabels = [
      'non empty string',
    ];

    validTimingLabels.forEach(label => {
      it(`should return true for label ${label}`, () => {
        expect(isValidServerTimingLabel(label)).toBe(true);
      });
    });

    const invalidTimingLabels = [
      '',
      ' ',
      0,
      1,
      [],
      {},
      function () {
      },
      NaN,
      null,
    ];

    invalidTimingLabels.forEach(label => {
      it(`should return false for label ${label}`, () => {
        expect(isValidServerTimingLabel(label)).toBe(false);
      });
    });
  });

  describe('isPlainObject', () => {
    const validTypes = [
      {},
    ];

    validTypes.forEach(value => {
      it(`should return true for value ${value}`, () => {
        expect(isPlainObject(value)).toBe(true);
      });
    });

    const invalidTypes = [
      '',
      null,
      0,
      1,
      [],
      function () {
      },
    ];

    invalidTypes.forEach(value => {
      it(`should return false for value ${value}`, () => {
        expect(isPlainObject(value)).toBe(false);
      });
    });
  });

  describe('convertHRToMilliseconds', () => {
    it('should convert process.hrtime result values to ms', () => {
      const mockSeconds = 1;
      const mockNanoseconds = 5 * 1e9;
      const data = [mockSeconds, mockNanoseconds];
      const expected = (1 * 1e9 + mockNanoseconds) / 1e6;

      expect(convertHRToMilliseconds(data)).toBe(expected);
    });
  });

  describe('createMetric', () => {
    const mockName = 'mock-name';
    const mockDescription = 'mock-description';
    it('should create metric object', () => {

      const mockMeta = {
        mockMeta: true,
      };

      const expected = {
        start: [expect.any(Number), expect.any(Number)],
        duration: undefined,
        complete: false,
        name: mockName,
        description: mockDescription,
        meta: mockMeta,
      };

      expect(createMetric({
        name: mockName,
        description: mockDescription,
        meta: mockMeta,
      })).toEqual(expected);
    });

    it('should create metric object with empty meta object if no meta was provided', () => {
      const expected = {
        start: [expect.any(Number), expect.any(Number)],
        duration: undefined,
        complete: false,
        name: mockName,
        description: mockDescription,
        meta: {},
      };
      expect(createMetric({
        name: mockName,
        description: mockDescription,
        meta: undefined,
      })).toEqual(expected);
    });
  });

  describe('server timing data', () => {
    let mockServerTimigData;
    let mockGlobalMeta;

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
        description: undefined,
        meta: {},
      };

      it('should set metric to map under given name', () => {
        const startServerTimingHandler = startServerTiming(mockServerTimigData);

        startServerTimingHandler(mockName);
        expect(mockServerTimigData.get(mockName)).toEqual(expected);
      });

      it('should set metric to map under given name and assign global metadata', () => {
        mockGlobalMeta = {
          globalMeta: true,
        };
        const startServerTimingHandler = startServerTiming(mockServerTimigData, mockGlobalMeta);

        startServerTimingHandler(mockName);
        const expectedWithGlobalData = {
          ...expected,
          meta: mockGlobalMeta,
        };
        expect(mockServerTimigData.get(mockName)).toEqual(expectedWithGlobalData);
      });

      it('should set metric to map under given name and merge meta data to global meta', () => {
        const mockDescription = 'mock-description';
        mockGlobalMeta = {
          globalMeta: true,
        };
        const mockLocalMeta = {
          localMeta: true,
        };
        const startServerTimingHandler = startServerTiming(mockServerTimigData, mockGlobalMeta);

        startServerTimingHandler(mockName, mockDescription, mockLocalMeta);
        const expectedWithGlobalAndLocalData = {
          ...expected,
          description: mockDescription,
          meta: {
            ...mockGlobalMeta,
            ...mockLocalMeta,
          },
        };
        expect(mockServerTimigData.get(mockName)).toEqual(expectedWithGlobalAndLocalData);
      });

      it('should not set metric to map when name has not valid type', () => {
        const startServerTimingHandler = startServerTiming(mockServerTimigData, mockGlobalMeta);

        startServerTimingHandler();
        expect(mockServerTimigData.size).toBe(0);
      });
    });

    describe('endServerTiming', () => {
      it('should set complete flag to true to the metric stored under the given name', () => {
        const mockName = 'mock-name';
        const startServerTimingHandler = startServerTiming(mockServerTimigData);
        const endServerTimingHandler = endServerTiming(mockServerTimigData);

        startServerTimingHandler(mockName);

        const metric = mockServerTimigData.get(mockName);
        expect(metric.complete).toBe(false);
        endServerTimingHandler(mockName);
        expect(metric.complete).toBe(true);
      });

      it('should set duration for the metric stored under the given name', () => {
        const mockName = 'mock-name';
        const startServerTimingHandler = startServerTiming(mockServerTimigData);
        const endServerTimingHandler = endServerTiming(mockServerTimigData);

        startServerTimingHandler(mockName);

        const metric = mockServerTimigData.get(mockName);
        expect(metric.duration).toBeUndefined();
        endServerTimingHandler(mockName);
        expect(metric.duration).toEqual(expect.any(Number));
      });

      it('should do nothing and run console.warn when not valid name is passed', () => {
        const endServerTimingHandler = endServerTiming(mockServerTimigData);
        endServerTimingHandler(null);
        expect(global.console.warn).toHaveBeenCalledWith(`Wrong name supplied for tracking: ${null}`);
      });

      it('should do nothing and run console.warn when no metric is found under given name', () => {
        const mockName = 'mock-name';
        const mockNonExistingName = 'non-existing-name';
        const startServerTimingHandler = startServerTiming(mockServerTimigData);
        const endServerTimingHandler = endServerTiming(mockServerTimigData);

        startServerTimingHandler(mockName);
        endServerTimingHandler(mockNonExistingName);
        expect(global.console.warn).toHaveBeenCalledWith(`No metric tracked for ${mockNonExistingName} name`);
      });
    });

    describe('getServerTimingsSnapshot', () => {
      it('should return list of metrics with duration value set to all uncomplete ones', () => {
        const mockNames = [
          'mock-name1',
          'mock-name2',
        ];

        mockNames.forEach((name) => {
          mockServerTimigData.set(name, {
            start: [0, 123],
            duration: undefined,
            complete: false,
            name,
            description: name,
            meta: {},
          });
        });

        const getServerTimingsSnapshotHandler = getServerTimingsSnapshot(mockServerTimigData);
        const expected = mockNames.map((name) => ({
          start: [0, 123],
          duration: expect.any(Number),
          complete: false,
          name,
          description: name,
          meta: {},
        }));

        expect(getServerTimingsSnapshotHandler()).toEqual(expected);
      });

      it('should return list of metrics with duration value and complete set to all uncomplete ones', () => {
        const mockNames = [
          'mock-name1',
          'mock-name2',
        ];

        mockNames.forEach((name) => {
          mockServerTimigData.set(name, {
            start: [0, 123],
            duration: undefined,
            complete: false,
            name,
            description: name,
            meta: {},
          });
        });

        const getServerTimingsSnapshotHandler = getServerTimingsSnapshot(mockServerTimigData);
        const expected = mockNames.map((name) => ({
          start: [0, 123],
          duration: expect.any(Number),
          complete: true,
          name,
          description: name,
          meta: {},
        }));

        expect(getServerTimingsSnapshotHandler({ end: true })).toEqual(expected);
      });
    });

    describe('createServerTimingTracker', () => {
      describe('with global meta', () => {
        it('should create tracker with global meta that will be assigned to each metric', () => {
          const mockGlobalMeta = {
            globalMeta: true,
          };
          const trackNamesData = [{
            name: 'mock-name1',
            meta: {
              mockMeta: 1
            },
          }, {
            name: 'mock-name2',
            meta: {
              mockMeta: 2
            },
          }];
          const tracker = createServerTimingTracker({
            meta: mockGlobalMeta,
          });

          trackNamesData.forEach((trackData) => {
            tracker.start(trackData.name, undefined, trackData.meta);
          });

          trackNamesData.forEach((trackData) => {
            tracker.end(trackData.name);
          });

          const metrics = tracker.getSnapshot();

          metrics.forEach((metric, index) => {
            const trackMeta = trackNamesData[index].meta;
            const expected = {
              ...mockGlobalMeta,
              ...trackMeta,
            }
            expect(metric.meta).toEqual(expected);
          });
        });
      });

      describe('without global meta', () => {
        it('should create tracker with global meta that will be assigned to each metric', () => {
          const trackNamesData = [{
            name: 'mock-name1',
            meta: {
              mockMeta: 1
            },
          }, {
            name: 'mock-name2',
            meta: {
              mockMeta: 2
            },
          }];
          const tracker = createServerTimingTracker({
            meta: mockGlobalMeta,
          });

          trackNamesData.forEach((trackData) => {
            tracker.start(trackData.name, undefined, trackData.meta);
          });

          trackNamesData.forEach((trackData) => {
            tracker.end(trackData.name);
          });

          const metrics = tracker.getSnapshot();

          metrics.forEach((metric, index) => {
            expect(metric.meta).toEqual(metric.meta);
          });
        });
      });
    });
  });
});