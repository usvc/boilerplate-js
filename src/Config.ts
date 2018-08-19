import * as convict from 'convict';

export interface Config extends convict.Config<{
  fluentdHost: string | undefined;
  fluentdPort: string | undefined;
  env: string;
  livenessCheckEndpoint: string | undefined;
  metricsEndpoint: string | undefined;
  readinessCheckEndpoint: string | undefined;
  serviceId: string | undefined;
  zipkinHost: string | undefined;
  zipkinPort: string | undefined;
  zipkinSampleFrequency: number | undefined;
  zipkinScheme: string | undefined;
}> {}

export function load(): Config {
  return convict(
    {
      fluentdHost: {
        doc: 'Hostname of the FluentD server instance',
        default: undefined,
        env: 'FLUENTD_HOST',
      },
      fluentdPort: {
        doc: 'Port of the FluentD server instance',
        default: undefined,
        env: 'FLUENTD_PORT',
      },
      env: {
        doc: 'Application environment',
        format: ['production', 'development', 'test'],
        default: 'development',
        env: 'NODE_ENV',
      },
      livenessCheckEndpoint: {
        doc: 'Liveness check endpoint',
        default: undefined,
        env: 'LIVENESS_CHECK_ENDPOINT'
      },
      metricsEndpoint: {
        doc: 'Metrics collection endpoint',
        default: undefined,
        env: 'METRICS_ENDPOINT',
      },
      readinessCheckEndpoint: {
        doc: 'Readiness check endpoint',
        default: undefined,
        env: 'READINESS_CHECK_ENDPOINT'
      },
      serviceId: {
        doc: 'ID of the current instance',
        default: undefined,
        env: 'SERVICE_ID',
      },
      zipkinHost: {
        doc: 'Hostname of the Zipkin server instance',
        default: undefined,
        env: 'ZIPKIN_HOST',
      },
      zipkinPort: {
        doc: 'Port of the Zipkin server instance',
        default: undefined,
        env: 'ZIPKIN_PORT',
      },
      zipkinSampleFrequency: {
        doc: 'How often should requests be traced (0.0-1.0)',
        default: undefined,
        env: 'ZIPKIN_SAMPLE_FREQUENCY',
      },
      zipkinScheme: {
        doc: 'Scheme of the Zipkin server instance',
        default: undefined,
        env: 'ZIPKIN_SCHEME',
      },
    }
  );
}
