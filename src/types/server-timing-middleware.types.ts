import type { Request } from 'express';

export interface ExpressServerTimingMiddlewareProps {
  namespace: string;
  writeHeaders: boolean | ((req: Request) => boolean);
  meta: any;
  beforeEmit?: () => void;
}

export type ServerTimingMetric = {
  start: ReturnType<typeof process.hrtime>;
  duration: number | undefined;
  complete: false;
  name: string;
  description: string;
};

export type ExpressServerTimingTracker = {
  start: (name: string, description?: string) => void;
  end: (name: string) => void;
  getSnapshot: (options?: { end: boolean }) => ServerTimingMetric[];
};

export type ExpressServerTimingsData = Map<string, ServerTimingMetric>;

export type ExpressServerTimingRequest<T> = {
  [Property in keyof T]?: ExpressServerTimingTracker;
} & Request;
