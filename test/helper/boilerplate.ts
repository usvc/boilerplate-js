import {Boilerplate} from '../../src/Boilerplate';

Boilerplate.init({
  appCookieSessionName: 'usvcbp',
  appCorsWhitelist: [
    'http://_test.com'
  ],
  appJsonBodyContentType: '*/json',
  appJsonBodySizeLimit: '2mb',
  appLivenessChecks: {
    truthy: () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({status: true});
        }, 500);
      }),
  },
  appLivenessCheckEndpoint: '/healthz',
  appMetricsEndpoint: '/metrics',
  appReadinessChecks: {
    falsey: () =>
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
});

export {Boilerplate};
