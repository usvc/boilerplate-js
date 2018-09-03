import * as express from 'express';
import * as TransportStream from 'winston-transport';
import * as winston from 'winston';
import {Tracer} from './Tracer';
import {ExplicitContext, Context, TraceId} from 'zipkin';
import * as fluentLogger from 'fluent-logger';
import {TransformFunction} from 'logform';
import {load as loadConfig, Config} from './Config';
import {createLogger, Logger, LoggerModule} from './Logger';
import {createRequest, RequestRequester, RequesterModule} from './Request';
import {createTracer, TracerService} from './Tracer';
import {createApp} from './App';
import {
  DEFAULT_LIVENESS_ENDPOINT,
  DEFAULT_READINESS_ENDPOINT,
  DEFAULT_SERVICE_ID,
  DEFAULT_METRICS_ENDPOINT,
  DEFAULT_BODY_SIZE_LIMIT,
  DEFAULT_JSON_BODY_CONTENT_TYPE,
  DEFAULT_URL_ENCODED_BODY_CONTENT_TYPE,
  DEFAULT_CSP_CHILD_SRC,
  DEFAULT_CSP_CONNECT_SRC,
  DEFAULT_CSP_DEFAULT_SRC,
  DEFAULT_CSP_FONT_SRC,
  DEFAULT_CSP_FRAME_SRC,
  DEFAULT_CSP_IMG_SRC,
  DEFAULT_CSP_MEDIA_SRC,
  DEFAULT_CSP_OBJECT_SRC,
  DEFAULT_CSP_REPORT_URI,
  DEFAULT_CSP_SCRIPT_SRC,
  DEFAULT_CSP_STYLE_SRC,
} from './defaults';
import {
  HealthCheckList
} from './types';

export interface AppOptions {
  appAccessLoggingBypassUrls?: string[];
  appCookieSessionName?: string;
  appCorsWhitelist?: string[];
  appCspChildSrc?: string[];
  appCspConnectSrc?: string[];
  appCspDefaultSrc?: string[];
  appCspFontSrc?: string[];
  appCspFrameSrc?: string[];
  appCspImgSrc?: string[];
  appCspMediaSrc?: string[];
  appCspObjectSrc?: string[];
  appCspReportUri?: string;
  appCspScriptSrc?: string[];
  appCspStyleSrc?: string[];
  appEnableCors?: boolean;
  appEnableCsp?: boolean;
  appJsonBodyContentType?: string;
  appJsonBodySizeLimit?: string;
  appLivenessChecks?: HealthCheckList;
  appLivenessCheckEndpoint?: string;
  appMetricsEndpoint?: string;
  appReadinessChecks?: HealthCheckList;
  appReadinessCheckEndpoint?: string;
  appUrlEncodedBodyContentType?: string;
  appUrlEncodedBodySizeLimit?: string;
}

export interface LoggerWinstonOptions {
  logger?: LoggerModule;
  winstonFormats?: TransformFunction[];
  winstonLevel?: string;
  winstonLevels?: {
    [key: string]: string;
  };
  winstonTransports?: TransportStream[];
}
export type LoggerModuleOptions = LoggerWinstonOptions;

export type LogsCollator = TransportStream;
export type LogsCollatorService = 'fluentd';
export interface LogsCollatorFluentdOptions {
  logsCollator?: LogsCollatorService;
  fluentdHost?: string;
  fluentdPort?: string;
}
export type LogsCollatorOptions = LogsCollatorFluentdOptions;

export type Requester = RequestRequester;
export interface RequestRequestOptions {
  requester?: RequesterModule;
}
export type RequesterModuleOptions = RequestRequestOptions;

export interface TracerZipkinOptions {
  tracer?: TracerService;
  zipkinHeaders?: object;
  zipkinHost?: string;
  zipkinPort?: string;
  zipkinSampleFrequency?: number;
  zipkinScheme?: 'http' | 'https';
}
export type TracerOptions = TracerZipkinOptions;

export interface BoilerplateInitOptions extends
  AppOptions,
  LoggerModuleOptions,
  LogsCollatorOptions,
  RequesterModuleOptions,
  TracerZipkinOptions
{
  serviceId?: string;
}

export class Boilerplate {
  static app: express.Application;
  static config: Config;
  static context: Context<TraceId>;
  static logsCollator: LogsCollator;
  static logger: Logger;
  static request: Requester;
  static serviceId: string;
  static tracer: Tracer;

  static init({
    logger = 'winston',
    logsCollator = 'fluentd',
    requester = 'request',
    tracer = 'zipkin',
    appAccessLoggingBypassUrls = [],
    appCookieSessionName = DEFAULT_SERVICE_ID,
    appCorsWhitelist = [],
    appCspChildSrc = DEFAULT_CSP_CHILD_SRC,
    appCspConnectSrc = DEFAULT_CSP_CONNECT_SRC,
    appCspDefaultSrc = DEFAULT_CSP_DEFAULT_SRC,
    appCspFontSrc = DEFAULT_CSP_FONT_SRC,
    appCspFrameSrc = DEFAULT_CSP_FRAME_SRC,
    appCspImgSrc = DEFAULT_CSP_IMG_SRC,
    appCspMediaSrc = DEFAULT_CSP_MEDIA_SRC,
    appCspObjectSrc = DEFAULT_CSP_OBJECT_SRC,
    appCspReportUri = DEFAULT_CSP_REPORT_URI,
    appCspScriptSrc = DEFAULT_CSP_SCRIPT_SRC,
    appCspStyleSrc = DEFAULT_CSP_STYLE_SRC,
    appEnableCors = true,
    appEnableCsp = true,
    appJsonBodyContentType = DEFAULT_JSON_BODY_CONTENT_TYPE,
    appJsonBodySizeLimit = DEFAULT_BODY_SIZE_LIMIT,
    appLivenessChecks = {},
    appLivenessCheckEndpoint = DEFAULT_LIVENESS_ENDPOINT,
    appMetricsEndpoint = DEFAULT_METRICS_ENDPOINT,
    appReadinessChecks = {},
    appReadinessCheckEndpoint = DEFAULT_READINESS_ENDPOINT,
    appUrlEncodedBodyContentType = DEFAULT_URL_ENCODED_BODY_CONTENT_TYPE,
    appUrlEncodedBodySizeLimit = DEFAULT_BODY_SIZE_LIMIT,
    fluentdHost = 'localhost',
    fluentdPort = '24224',
    serviceId = DEFAULT_SERVICE_ID,
    winstonFormats = [],
    winstonLevel = 'silly',
    winstonTransports = [],
    zipkinHeaders = {},
    zipkinHost = 'localhost',
    zipkinPort = '9411',
    zipkinSampleFrequency = 1.0,
    zipkinScheme = 'http',
  }: BoilerplateInitOptions = {}): void {
    Boilerplate.config = loadConfig();

    // configuration
    Boilerplate.serviceId = Boilerplate.config.get('serviceId') || serviceId;

    // context init
    Boilerplate.context = new ExplicitContext();

    // tracer init
    Boilerplate.tracer = (() => {
      switch(tracer) {
        case 'zipkin':
          return createTracer({
            context: Boilerplate.context,
            headers: zipkinHeaders,
            host: Boilerplate.config.get('zipkinHost') || zipkinHost,
            port: Boilerplate.config.get('zipkinPort') || zipkinPort,
            sampleFrequency:
              Boilerplate.config.get('zipkinSampleFrequency')
              || zipkinSampleFrequency,
            scheme: Boilerplate.config.get('zipkinScheme') || zipkinScheme,
          });
        default:
          // tslint:disable-next-line max-line-length
          throw new Error(`Provided tracer "${tracer}" is not a supported tracer.`);
      }
    })();

    // requester init
    Boilerplate.request = (() => {
      switch (requester) {
        case 'request':
          switch (tracer) {
            case 'zipkin':
              return createRequest({tracer: Boilerplate.tracer});
            default:
              // tslint:disable-next-line max-line-length
              throw new Error(`Provided tracer "${tracer}" is not a supported tracer.`);
          }
        default:
          // tslint:disable-next-line max-line-length
          throw new Error(`Provided requester "${requester}" is not a supported request module.`);
      }
    })();

    // logs collator init
    Boilerplate.logsCollator = (() => {
      const host = Boilerplate.config.get('fluentdHost') || fluentdHost;
      const port = Boilerplate.config.get('fluentdPort') || fluentdPort;
      switch (logsCollator) {
        case 'fluentd':
          switch (logger) {
            case 'winston':
              const fluentTransport =
              fluentLogger.support.winstonTransport();
              return new fluentTransport({
                host,
                port,
                timeout: 5.0,
                requireAckResponse: true,
              });
            default:
              // tslint:disable-next-line max-line-length
              throw new Error(`Provided logger "${logger}" is not a supported for the logs collator "${logsCollator}".`);
          }
          default:
            // tslint:disable-next-line max-line-length
            throw new Error(`Provided logs collator "${logsCollator}" is not a supported logs collator.`);
      }
    })();

    // logger init
    Boilerplate.logger = (() => {
      switch(logger) {
        case 'winston':
          if (tracer !== 'zipkin') {
            // tslint:disable-next-line max-line-length
            throw new Error(`Provided tracer "${tracer}" is not supported for the logger "${logger}".`);
          } else if (logsCollator !== 'fluentd') {
            // tslint:disable-next-line max-line-length
            throw new Error(`Provided logs collator "${logsCollator}" is not supported for the logger "${logger}".`);
          } else {
            return createLogger({
              context: Boilerplate.context,
              formats: winstonFormats,
              level: winstonLevel,
              logsCollatorTransport: Boilerplate.logsCollator,
              tracer,
              transports: winstonTransports,
            });
          }
        default:
          // tslint:disable-next-line max-line-length
          throw new Error(`Provided logger "${logger}" is not a supported logger.`);
      }
    })();

    // server application init
    Boilerplate.app = createApp({
      accessLoggingBypassUrls: appAccessLoggingBypassUrls,
      cookieSessionName: appCookieSessionName,
      context: Boilerplate.context,
      corsWhitelist: appCorsWhitelist,
      cspChildSrc: appCspChildSrc,
      cspConnectSrc: appCspConnectSrc,
      cspDefaultSrc: appCspDefaultSrc,
      cspFontSrc: appCspFontSrc,
      cspFrameSrc: appCspFrameSrc,
      cspImgSrc: appCspImgSrc,
      cspMediaSrc: appCspMediaSrc,
      cspObjectSrc: appCspObjectSrc,
      cspReportUri: appCspReportUri,
      cspScriptSrc: appCspScriptSrc,
      cspStyleSrc: appCspStyleSrc,
      enableCors: appEnableCors,
      enableCsp: appEnableCsp,
      jsonBodyContentType: appJsonBodyContentType,
      jsonBodySizeLimit: appJsonBodySizeLimit,
      livenessChecks: appLivenessChecks,
      livenessCheckEndpoint:
        Boilerplate.config.get('livenessCheckEndpoint')
        || appLivenessCheckEndpoint,
      logger: Boilerplate.logger,
      metricsEndpoint: 
        Boilerplate.config.get('metricsEndpoint')
        || appMetricsEndpoint,
      morganStream: createMorganStream(Boilerplate.logger),
      readinessChecks: appReadinessChecks,
      readinessCheckEndpoint:
        Boilerplate.config.get('livenessCheckEndpoint')
        || appReadinessCheckEndpoint,
      serviceId: Boilerplate.serviceId,
      tracer: Boilerplate.tracer,
      urlEncodedBodyContentType: appUrlEncodedBodyContentType,
      urlEncodedBodySizeLimit: appUrlEncodedBodySizeLimit,
    });
  }  
}

function createMorganStream(
  logger: Logger,
) {
  return (message: any) => {
    const log = JSON.parse(message);
    logger.http('access', {
      message: 'access',
      ...log
    });
  };
}
