# `@usvc/boilerplate`
Quick, opinionated, Express-based boilerplate for microservices written in Node.

# What's Included

- [x] Metrics monitoring with Prometheus
- [x] Contextual logging with Winston
- [x] Logs centralisation with FluentD (td-agent)
- [x] Distributed tracing with Zipkin
- [x] Tracable request object with Zipkin
- [x] Bootstrapped HTTP server with Express
- [x] Liveness and readiness health checks
- [x] Cross Origin Resource Sharing (CORS) support
- [x] Content Security Policy (CSP) support

# TL;DR
- [What's Included](#what-s-included)
- [Usage](#usage)
  - [Basic Usage](#basic-usage-w--no-configuration)
  - [Advanced Usage](#advanced-usage-w--full-configuration)
- [Examples](#examples)
  - [Proof-of-Concept](#proof-of-concept)
- [Configuration](#configuration)
  - [Configuring Boilerplate](#configuring-boilerplate)
  - [Configuring Application](#configuring-application)
  - [Configuring Logs Collator](#configuring-logs-collator)
  - [Configuring Logger](#configuring-logger)
  - [Configuring Tracer](#configuring-tracer)
- [Types](#types)
  - [`Health`](#type--health)

# Usage
Install this boilerplate with:

```bash
npm i @usvc/boilerplate;
# or via yarn
yarn add @usvc/boilerplate;
```

## Basic Usage w/ No Configuration
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

## Advanced Usage w/ Full Configurations
```js
import {Boilerplate} from '@usvc/boilerplate';

Boilerplate.init({
  appCookieSessionName: 'usvcbp',
  appCorsWhitelist: [],
  appCspChildSrc: ['"self"'],
  appCspConnectSrc: ['"self"'],
  appCspDefaultSrc: ['"self"'],
  appCspFontSrc: ['"self"'],
  appCspFrameSrc: ['"self"'],
  appCspImgSrc: ['"self"'],
  appCspMediaSrc: ['"self"'],
  appCspObjectSrc: ['"none"'],
  appCspReportUri: '/csp-report',
  appCspScriptSrc: ['"self"'],
  appCspStyleSrc: ['"self"'],
  appEnableCors: true,
  appEnableCsp: true,
  appJsonBodyContentType: '*/json',
  appJsonBodySizeLimit: '2mb',
  appLivenessCheckEndpoint: '/healthz',
  appLivenessChecks: {},
  appMetricsEndpoint: '/metrics',
  appReadinessCheckEndpoint: '/readyz',
  appReadinessChecks: {},
  appUrlEncodedBodyContentType: '*/x-www-form-urlencoded',
  appUrlEncodedBodySizeLimit: '2mb',
  logger: 'winston',
  logsCollator: 'fluentd',
  fluentdHost: 'localhost',
  fluentdPort: '24224',
  requester: 'request',
  serviceId: 'usvcbp',
  tracer: 'zipkin',
  winstonFormats: [],
  winstonLevel: 'silly',
  winstonTransports: [],
  zipkinHeaders: {},
  zipkinHost: 'localhost',
  zipkinPort: '9411',
  zipkinSampleFrequency: 1.0,
  zipkinScheme: 'http',
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

## Configuring Boilerplate

| Config Parameter | Environment Variable | Default Value | Description |
| --- | --- | --- | -- |
| `logger` | N/A | `"winston"` | Decides which logger to use |
| `logsCollator` | N/A | `"fluentd"` | Decides which logs collator to use |
| `requester` | N/A | `"request"` | Decides which request module to use |
| `tracer` | N/A | `"zipkin"` | Decides which tracer to use |
| `serviceId` | `SERVICE_ID` | `"usvcbp"` | The ID of the service instance we're spinning up |

## Configuring Application

| Config Parameter | Environment Variable | Default Value | Description |
| --- | --- | --- | -- |
| `appCookieSessionName` | N/A | `"usvcbp"` | Cookie session name |
| `appCorsWhitelist` | N/A | `[]` | URL whitelist for Cross Origin Resource Sharing (CORS) |
| `appCspChildSrc` | N/A | `['"self"']` | Defines the `child-src` property in the Content Security Policy |
| `appCspConnectSrc` | N/A | `['"self"']` | Defines the `connect-src` property in the Content Security Policy |
| `appCspDefaultSrc` | N/A | `['"self"']` | Defines the `default-src` property in the Content Security Policy |
| `appCspFontSrc` | N/A | `['"self"']` | Defines the `font-src` property in the Content Security Policy |
| `appCspFrameSrc` | N/A | `['"self"']` | Defines the `frame-src` property in the Content Security Policy |
| `appCspImgSrc` | N/A | `['"self"']` | Defines the `img-src` property in the Content Security Policy |
| `appCspMediaSrc` | N/A | `['"self"']` | Defines the `media-src` property in the Content Security Policy |
| `appCspObjectSrc` | N/A | `['"none"']` | Defines the `object-src` property in the Content Security Policy |
| `appCspReportUri` | N/A | `/csp-report` | Defines the `report-uri` property in the Content Security Policy |
| `appCspScriptSrc` | N/A | `['"self"']` | Defines the `script-src` property in the Content Security Policy |
| `appCspStyleSrc` | N/A | `['"self"']` | Defines the `style-src` property in the Content Security Policy |
| `appEnableCors` | N/A | `true` | If set to `false`, disables Cross Origin Resource Sharing (CORS) (useful for server-side-only services) |
| `appEnableCsp` | N/A | `true` | If set to `false`, disables Content Security Policy (CSP) from being sent (useful for server-side-only services) |
| `appJsonBodyContentType` | N/A | `"*/json"` | Defines the `Content-Type` HTTP header value before the body value is parsed as JSON |
| `appJsonBodySizeLimit` | N/A | `"2mb"` | Defines the maximum size limit of the JSON body when `Content-Type` HTTP header is set to the value of `:appJsonBodyContentType` |
| `appLivenessChecks` | N/A | `{}` | A key-value mapping where the key is a `string` identifying the check, and the value is a `function` returning a Promise that resolves to a [`Health` object](#type--health) |
| `appLivenessCheckEndpoint` | `LIVENESS_CHECK_ENDPOINT` | `"/healthz"` | Endpoint from which a container orchestrator can do a HTTP GET to check the service instance's liveness |
| `appMetricsEndpoint` | `METRICS_ENDPOINT` | `"/metrics"` | Endpoint from which a metrics scraper can use to access the metrics of the service instance |
| `appReadinessChecks` | N/A | `{}` | A key-value mapping where the key is a `string` identifying the check, and the value is a `function` returning a Promise that resolves to a [`Health` object](#type--health) |
| `appReadinessCheckEndpoint` | `READINESS_CHECK_ENDPOINT` | `"/readyz"` | Endpoint from which a container orchestrator can do a HTTP GET to check the service instance's readiness for requests |
| `appUrlEncodedBodyContentType` | N/A | `"*/x-www-form-urlencoded"` | Defines the `Content-Type` HTTP header value before the body value is parsed as JSON |
| `appUrlEncodedBodySizeLimit` | N/A | `"2mb"` | Defines the maximum size limit of the JSON body when `Content-Type` HTTP header is set to the value of `:appUrlEncodedBodyContentType` |

## Configuring Logs Collator

| Config Parameter | Environment Variable | Default Value | Description |
| --- | --- | --- | -- |
| `fluentdHost` | `FLUENTD_HOST` | `"localhost"` | Host of the FluentD service instance |
| `fluentdPort` | `FLUENTD_PORT` | `"24224"` | Port of the FluentD service instance |

## Configuring Logger

| Config Parameter | Environment Variable | Default Value | Description |
| --- | --- | --- | -- |
| `winstonFormats` | N/A | `[]` | Array of unwrapped Winston formats |
| `winstonLevel` | N/A | `"silly"` | Minimum level to log |
| `winstonTransports` | N/A | `[]` | Array of additional Winston transports to use |

## Configuring Tracer

| Config Parameter | Environment Variable | Default Value | Description |
| --- | --- | --- | -- |
| `zipkinHeaders` | N/A | `{}` | Additional headers to add to the Zipkin API call |
| `zipkinHost` | `ZIPKIN_HOST` | `"localhost"` | Host of the Zipkin instance |
| `zipkinPort` | `ZIPKIN_PORT` | `"9411"` | Port of the Zipkin instance |
| `zipkinSampleFrequency` | `ZIPKIN_SAMPLE_FREQUENCY` | `1.0` | Frequency of request sampling |
| `zipkinScheme` | `ZIPKIN_SCHEME` | `"http"` | Protocol of the Zipkin instance |

# Types

## Type: Health
```typescript
interface Health {
  data?: object;
  message?: string;
  status: boolean;
}
```

# Development Lifecycle

> **TODO**

# License
This package is licensed under the MIT license. See the [LICENSE file](./LICENSE) for details.

# Cheers