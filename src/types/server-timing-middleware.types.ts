import type { Request, Response, NextFunction } from 'express';

export interface ExpressServerTimingMiddlewareProps {
  namespace?: string;
  writeHeaders?: boolean | ((req: Request) => boolean);
}

export type ExpressServerTimingMiddleware = (
  req: Request,
  res: Response,
  nex: NextFunction,
) => void;
export type ExpressServerTimingMiddlewareFactory = (
  props: ExpressServerTimingMiddlewareProps,
) => ExpressServerTimingMiddleware;

export type ExpressServerTimingMetric = {
  start: ReturnType<typeof process.hrtime>;
  duration: number | undefined;
  complete: false;
  name: string;
  description: string;
};

export type ExpressServerTimingTracker = {
  start: (name: string, description?: string) => void;
  end: (name: string) => void;
  getSnapshot: (options?: { end: boolean }) => ExpressServerTimingMetric[];
};

export type ExpressServerTimingsData = Map<string, ExpressServerTimingMetric>;

declare module 'http' {
  interface IncomingMessage {
    serverTiming: ExpressServerTimingTracker;
  }
}
