# `@usvc/boilerplate`
Quick, opinionated, Express-based boilerplate for microservices written in Node.

# Scope

- [x] Metrics monitoring with Prometheus
- [x] Contextual logging with Winston
- [x] Logs centralisation with FluentD (td-agent)
- [x] Distributed tracing with Zipkin
- [x] Tracable request object with Zipkin
- [x] Bootstrapped HTTP server with Express
- [x] Liveness and readiness health checks
- [x] Cross Origin Resource Sharing (CORS) support
- [ ] Content Security Policy (CSP) support

# Usage
Install this boilerplate with:

```bash
npm i @usvc/boilerplate;
# or via yarn
yarn add @usvc/boilerplate;
```

## Basic
```js
import {Boilerplate} from '@usvc/boilerplate';

Boilerplate.init();

const {
  app, // bootstrapped Express application
  logger, // contextual logger
  request, // request object
} = Boilerplate;

const server = app.listen(3000);

server.on('listening', () => {
  logger.info('Server listening on http://localhost:3000');
});
```

## With Full Configurations
```js
import {Boilerplate} from '@usvc/boilerplate';

Boilerplate.init({
  appCookieSessionName: 'usvcbp',
  appCorsWhitelist: [],
  appJsonBodyContentType: '*/json',
  appJsonBodySizeLimit: '2mb',
  appLivenessChecks: {},
  appReadinessChecks: {},
  appUrlEncodedBodyContentType: '*/x-www-form-urlencoded',
  appUrlEncodedBodySizeLimit: '2mb',
  logger: 'winston',
  loggerFormats: [],
  loggerLevel: 'silly',
  loggerTransports: [],
  logsCollator: 'fluentd',
  logsCollatorHost: 'localhost',
  logsCollatorPort: '24224',
  requester: 'request',
  serviceId: 'my-service',
  tracer: 'zipkin',
  tracerHeaders: {},
  tracerHost: 'localhost',
  tracerPort: '9411',
  tracerSampleFrequency: 1.0,
  tracerScheme: 'http',
});
```

# Examples

## Proof-of-Concept
> Requires `docker` and `docker-compose` to be available on your machine

Clone this repository, install dependencies and run:

```bash
npm run eg:poc;
```

To shut it down, run:

```bash
npm run eg:poc:down;
```

# Configuration
The boilerplate is initialized through the `.init()` function. It accepts configuration options from both the environment as well as parameters. Note that **environment configuration will always take precendence over parameter configuration**, this is so that parameterised code can be written for development, but can also be modified for a production environment via environment.

| Config Parameter | Environment Variable | Default Value | Description |
| --- | --- | --- | -- |
| `logger` | N/A | `"winston"` | Decides which logger to use |
| `logsCollator` | N/A | `"fluentd"` | Decides which logs collator to use |
| `requester` | N/A | `"request"` | Decides which request module to use |
| `tracer` | N/A | `"zipkin"` | Decides which tracer to use |
| `serviceId` | `SERVICE_ID` | `"usvcbp"` | The ID of the service instance we're spinning up |

## Application

> **TODO** add in other application configs

| Config Parameter | Environment Variable | Default Value | Description |
| --- | --- | --- | -- |
| `appLivenessCheckEndpoint` | `LIVENESS_CHECK_ENDPOINT` | `"/healthz"` | Endpoint from which a container orchestrator can do a HTTP GET to check the service instance's liveness |
| `appReadinessCheckEndpoint` | `READINESS_CHECK_ENDPOINT` | `"/readyz"` | Endpoint from which a container orchestrator can do a HTTP GET to check the service instance's readiness for requests |

## Logs Collator

| Config Parameter | Environment Variable | Default Value | Description |
| --- | --- | --- | -- |
| `fluentdHost` | `FLUENTD_HOST` | `"localhost"` | Host of the FluentD service instance |
| `fluentdPort` | `FLUENTD_PORT` | `"24224"` | Port of the FluentD service instance |

## Logger

| Config Parameter | Environment Variable | Default Value | Description |
| --- | --- | --- | -- |
| `winstonFormats` | N/A | `[]` | Array of unwrapped Winston formats |
| `winstonLevel` | N/A | `"silly"` | Minimum level to log |
| `winstonTransports` | N/A | `[]` | Array of additional Winston transports to use |

## Metrics Collector

| Config Parameter | Environment Variable | Default Value | Description |
| --- | --- | --- | -- |
| `metricsEndpoint` | `METRICS_ENDPOINT` | `"/metrics"` | Endpoint from which Prometheus can scrape the service instance |

## Tracer

| Config Parameter | Environment Variable | Default Value | Description |
| --- | --- | --- | -- |
| `zipkinHeaders` | N/A | `{}` | Additional headers to add to the Zipkin API call |
| `zipkinHost` | `ZIPKIN_HOST` | `"localhost"` | Host of the Zipkin instance |
| `zipkinPort` | `ZIPKIN_PORT` | `"9411"` | Port of the Zipkin instance |
| `zipkinSampleFrequency` | `ZIPKIN_SAMPLE_FREQUENCY` | `1.0` | Frequency of request sampling |
| `zipkinScheme` | `ZIPKIN_SCHEME` | `"http"` | Protocol of the Zipkin instance |

# Development

> **TODO**

# License
This package is licensed under the MIT license. See the [LICENSE file](./LICENSE) for details.

# Cheers