import {Boilerplate, BoilerplateInitOptions} from '../../src/Boilerplate';
import {HealthCheck, Health} from '../../src/types';

const defaultOptions: BoilerplateInitOptions = {
  appCookieSessionName: 'usvcbp',
  appCorsWhitelist: [
    'http://_test.com'
  ],
  appJsonBodyContentType: '*/json',
  appJsonBodySizeLimit: '2mb',
  appLivenessChecks: {
    truthy: (): Promise<Health> =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({status: true});
        }, 500);
      }),
  },
  appLivenessCheckEndpoint: '/healthz',
  appMetricsEndpoint: '/metrics',
  appReadinessChecks: {
    falsey: (): Promise<Health> =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({status: false});
        }, 500);
      }),
  },
  appReadinessCheckEndpoint: '/readyz',
  appUrlEncodedBodyContentType: '*/x-www-form-urlencoded',
  appUrlEncodedBodySizeLimit: '2mb',
  logger: 'winston',
  winstonFormats: [],
  winstonLevel: 'silly',
  winstonTransports: [],
  logsCollator: 'fluentd',
  fluentdHost: 'localhost',
  fluentdPort: '24224',
  requester: 'request',
  serviceId: 'my-service',
  tracer: 'zipkin',
  zipkinHeaders: {},
  zipkinHost: 'localhost',
  zipkinPort: '9411',
  zipkinSampleFrequency: 1.0,
  zipkinScheme: 'http',
};

Boilerplate.init(defaultOptions);

export const withDefaults = {
  app: Boilerplate.app,
  logger: Boilerplate.logger,
  request: Boilerplate.request,
  tracer: Boilerplate.tracer,
};

Boilerplate.init({
  ...defaultOptions,
  requester: 'fetch',
});

console.info(Boilerplate.request);

export const withFetch = {
  app: Boilerplate.app,
  logger: Boilerplate.logger,
  request: Boilerplate.request,
  tracer: Boilerplate. tracer,
};

export {Boilerplate};
