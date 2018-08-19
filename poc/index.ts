import {Boilerplate} from '../src/Boilerplate';

Boilerplate.init({
  appCookieSessionName: 'usvcbp',
  appCorsWhitelist: [],
  appJsonBodyContentType: '*/json',
  appJsonBodySizeLimit: '2mb',
  appLivenessChecks: {
    database: () => 
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            status: true,
            message: 'ok',
          });
        }, 500);
      }),
  },
  appLivenessCheckEndpoint: '/healthz',
  appMetricsEndpoint: '/metrics',
  appReadinessChecks: {
    noop: () =>
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

const {app, logger} = Boilerplate;
app.get('/other', (req, res) => {
  require('./lib/extfn').createLog();
  res.json('ok');
});
const server = app.listen(8000);
server.on('listening', () => {
  logger.info({
    message: 'we\'re live!',
    app: `http://localhost:${server.address()['port']}`,
    grafana: 'http://localhost:3000',
    kibana: 'http://localhost:5601',
    prometheus: 'http://localhost:9090',
    zipkin: 'http://localhost:9411',
  });
});
