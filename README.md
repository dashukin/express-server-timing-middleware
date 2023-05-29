[![Build Status](https://travis-ci.com/dashukin/express-server-timing-middleware.svg?branch=master)](https://travis-ci.org/dashukin/express-server-timing-middleware)
[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/dashukin/express-server-timing-middleware/branch/master/graph/badge.svg)](https://codecov.io/gh/dashukin/express-server-timing-middleware)

# express-server-timing-middleware

Express middleware to measure application performance and add Server-Timing headers to response

### Motivation

- To get more control over server side performance on the level of logging and monitoring.
- To have ability to conditionally add Server-Timing headers based on request parameters
- To be able to extract Server-Timing metrics for further logging

### Usage

##### Add serverTiming middleware to your app router or subrouter

```typescript
import express from 'express';

import { createServerTimingMiddleware } from 'express-server-timing-middleware';

// example controllers
import { createRenderController } from './controllers/app-render.controller';
import { shouldWriteDebugHeaders } from './utils';

const app = express();

app.use([
  serverTiming({
    // define if headers should be included into response.
    // Use boolean value or a function that should return true to include Server-Timing header
    writeHeaders: process.env.NODE_ENV !== 'production' || shouldWriteDebugHeaders,
  }),
  // any other middlewares
]);

app.get(/.*/, createRenderController());

app.listen(APP_PORT, (error) => {
  if (error) {
  } else {
    console.log(`Express app started on port ${APP_PORT}`);
  }
});
```

```typescript
// utils.ts example
import type { Request } from 'express';

export const extractToken = (req: Request): string | undefined => {
  return req.header('my-secret-token');
};

export const checkTokenPermission = (token: string): boolean => {
  const parsedToken = decodeJWT(token);

  if (parsedToken === null) {
    return false;
  }
  return parsedToken.scopes.includes('my-secret-permission');
};

export const shouldWriteDebugHeaders = (req: Request) => {
  const token = extractTokenAndCheckPermissions(req);
  if (!token) {
    return false;
  }
  const hasValidPermissions = checkTokenPermission(token);

  return hasValidPermissions;
};
```

#### Use serverTiming tracker withing your controllers or middlewares

```typescript
// app-render.controller.ts example
import type { Request, Response, NextFunction } from 'express';

export const createRenderController =
  () => async (req: Request, res: Response, _next: NextFunction) => {
    try {
      // any tracking calls that were are not explicitly ended
      // will be fulfilled with final values right before sending response
      req.serverTiming.start('Request started', 'Optional description');

      req.serverTiming.start('render', 'render-application');
      const applicationResponse = await getSomeApplicationResponse();
      req.serverTiming.end('render');

      // do some other stuff

      res.send(applicationResponse);
    } catch (error) {
      req.log.error(error, 'Application rendering failed');
      next(error);
    }
  };
```

#### Use serverTiming tracker withing you middleware to collect all completed metrics

```typescript
// server-timing-logger.middleware.ts example
import type { Request, Response, NextFunction } from 'express';
import type { ExpressServerTimingMetric } from 'express-server-timing-middleware';

export const serverTimingLogger = () => (req: Request, res: Response, next: NextFunction) => {
  try {
    const serverTimings: ExpressServerTimingMetric[] = req.serverTiming.getSnapshot();
    // use any of loggers defined on request/app level to log data
    req.log.info(serverTimings, 'server timings');
    next();
  } catch (error) {
    req.log.error(error, 'Server timing logging failed.');
    next();
  }
};
```

#### Alternatives you might be interested

- [https://www.npmjs.com/package/server-timing](https://www.npmjs.com/package/server-timing)
- [https://www.npmjs.com/package/server-timing-header](https://www.npmjs.com/package/server-timing-header)
- [https://www.npmjs.com/package/server-timing-benchmark](https://www.npmjs.com/package/server-timing-benchmark)
- [https://www.npmjs.com/package/express-simple-timing](https://www.npmjs.com/package/express-simple-timing)
