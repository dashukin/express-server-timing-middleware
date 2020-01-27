[![Build Status](https://travis-ci.com/dashukin/express-server-timing-middleware.svg?branch=master)](https://travis-ci.org/dashukin/express-server-timing-middleware)
[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)
[![Coverage](https://codecov.io/gh/dashukin/express-server-timing-middleware/branch/master/graph/badge.svg)](https://codecov.io/gh/dashukin/express-server-timing-middleware)

# express-server-timing-middleware
Express middleware to measure application performance and add Server-Timing headers to response

### Motivation
- To get more control over server side performance on the level of logging and monitoring.
- To have ability to conditionally add Server-Timing headers based on request parameters
- To be able to extract Server-Timing metrics for further logging

### Usage

##### Add serverTiming middleware to your app router or subrouter
```javascript
import express from 'express';
import serverTiming from 'express-server-timing-middleware';
import { appRenderController } from './controllers/app-render.controller';
import { shouldWriteDebugHeaders } from './utils';

const app = express();

app.use([
  serverTiming({
    // optionally: override namespace to be used for calling tracker
    namespace: 'serverTimingTracker', // defaults to serverTiming
    // define if headers should be included into response. 
    // Use boolean value or a function that should return true to include Server-Timing header
    writeHeaders: process.env.NODE_ENV !== 'production' || shouldWriteDebugHeaders,
    // use any global meta to be added to server timing metrics
    meta: {
      env: process.env.APP_ENV,
    },
  }),
  // any other middlewares
]);

app.get(/.*/, appRenderController);

app.listen(APP_PORT, (error) => {
  if (error) {
    // handle error
  } else {
    console.log(`Express app started on port ${APP_PORT}`)
  }
});
```

#### Use serverTiming tracker withing your controllers or middlewares
```javascript
// app-render.controller.js
export const appRenderController = async (req, res) => {
    // any tracking calls that were are not explicitly ended 
    // will be fulfilled with final values right before sending response
    req.serverTimingTracker.start('Request started', 'Optional description', {
    // any optional meta information to align with server-timing metrics
    environment: process.env.ENV_NAME, 
    });
    req.serverTimingTracker.start('App render');
    const applicationResponse = await getSomeApplicationResponse();
    req.serverTimingTracker.end('App render');
    
    // do some other stuff
    res.send(applicationResponse);
}
```

#### Use serverTiming tracker withing you middleware to collect all completed metrics
```javascript
// server-timing-logger.middleware.js
export const serverTimingLogger  = () => (req, res, next) => {
  const serverTimings = req.serverTimingTracker.getSnapshot();
  // use any of loggers defined on request/app level to log data
  req.logger.log(serverTimings, 'server timings');
  next();
}
```


#### Alternatives you might be interested 
- [https://www.npmjs.com/package/server-timing](https://www.npmjs.com/package/server-timing)
- [https://www.npmjs.com/package/server-timing-header](https://www.npmjs.com/package/server-timing-header)
- [https://www.npmjs.com/package/server-timing-benchmark](https://www.npmjs.com/package/server-timing-benchmark)
- [https://www.npmjs.com/package/express-simple-timing](https://www.npmjs.com/package/express-simple-timing)

