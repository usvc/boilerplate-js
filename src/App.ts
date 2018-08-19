import * as os from 'os';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import cookieSession = require('cookie-session');
import * as cors from 'cors';
import * as express from 'express';
import {Request, Response, NextFunction} from 'express';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as promBundle from 'express-prom-bundle';
import {Context, TraceId, Tracer} from 'zipkin';
import {
  expressMiddleware as zipkinInstrumentationExpress,
} from 'zipkin-instrumentation-express';
import {option} from 'zipkin';
import {
  DEFAULT_METRICS_ENDPOINT,
  DEFAULT_LIVENESS_ENDPOINT,
  DEFAULT_READINESS_ENDPOINT,
  DEFAULT_SERVICE_ID,
  DEFAULT_BODY_SIZE_LIMIT,
} from './defaults';
import {
  HealthCheckList
} from './types';

export interface ContextualRequest extends Request {
  context: {
    parentId: string,
    spanId: string,
    traceId: string,
    sampled: option.IOption<boolean>,
  };
}

export interface CreateAppOptions {
  cookieSessionName?: string;
  context: Context<TraceId>;
  corsWhitelist?: string[];
  jsonBodyContentType?: string;
  jsonBodySizeLimit?: string;
  livenessChecks?: HealthCheckList;
  livenessCheckEndpoint?: string;
  logger: any;
  metricsEndpoint?: string;
  morganStream: any;
  readinessChecks?: HealthCheckList;
  readinessCheckEndpoint?: string;
  serviceId: string;
  tracer: Tracer;
  urlEncodedBodyContentType?: string;
  urlEncodedBodySizeLimit?: string;
}

export function createApp({
  cookieSessionName = DEFAULT_SERVICE_ID,
  context,
  corsWhitelist = [],
  jsonBodyContentType = '*/json',
  jsonBodySizeLimit = DEFAULT_BODY_SIZE_LIMIT,
  livenessChecks = {},
  livenessCheckEndpoint = DEFAULT_LIVENESS_ENDPOINT,
  logger = console,
  metricsEndpoint = DEFAULT_METRICS_ENDPOINT,
  morganStream = () => {},
  readinessChecks = {},
  readinessCheckEndpoint = DEFAULT_READINESS_ENDPOINT,
  serviceId = DEFAULT_SERVICE_ID,
  tracer,
  urlEncodedBodyContentType = '*/x-www-form-urlencoded',
  urlEncodedBodySizeLimit = DEFAULT_BODY_SIZE_LIMIT,
}: CreateAppOptions) {
  const app = express();
  const metrics = promBundle({
    autoregister: false,
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    promClient: {
      collectDefaultMetrics: true,
    },
  });

  app.use(metrics);
  app.use(helmet());
  app.use(zipkinInstrumentationExpress({tracer}));
  app.use(createContextMiddleware({context}));
  app.use(createCorsMiddleware({whitelist: corsWhitelist}));
  app.use(cookieParser());
  app.use(cookieSession({
    name: cookieSessionName,
    keys: ['', ''],
  }));
  app.use(createAccessLoggerMiddleware({
    serviceId,
    morganStream,
  }));
  app.use(bodyParser.json({
    limit: jsonBodySizeLimit,
    type: jsonBodyContentType,
  }));
  app.use(bodyParser.urlencoded({
    extended: true,
    limit: urlEncodedBodySizeLimit,
    type: urlEncodedBodyContentType,
  }));
  app.use(compression());
  app.get(metricsEndpoint, metrics.metricsMiddleware);
  app.get(
    livenessCheckEndpoint,
    createHealthCheckMiddleware({
      checks: livenessChecks,
    }));
  app.get(
    readinessCheckEndpoint,
    createHealthCheckMiddleware({
      checks: readinessChecks,
    }));

  return app;
}

export interface CreateHealthCheckMiddlewareOptions {
  checks: HealthCheckList;
}

function createHealthCheckMiddleware({
  checks = {},
}: CreateHealthCheckMiddlewareOptions): express.RequestHandler {
  return (req, res, next) => {
    Promise.all(
      Object.keys(checks)
        .map((key) => checks[key]()
        .then((result) => ({[key]: result}))
    ))
    .then((results) => results.reduce((c, i) => ({...c, ...i,}), {}))
    .then((results) => {
      const status =
        Object.keys(results)
          .map((key) => results[key].status)
          .reduce((p, c) => p && c, true);
      res
        .status(status ? 200 : 500)
        .json(results);
    });
  };
}

export interface CreateAccessLoggerMiddlewareOptions {
  serviceId: string;
  morganStream: any;
}

function createAccessLoggerMiddleware({
  serviceId,
  morganStream,
}: CreateAccessLoggerMiddlewareOptions): express.RequestHandler {
  return morgan((
    tokens: morgan.TokenIndexer,
    req: any,
    res: Response,
  ) => {
    const message = {
      contentLength: tokens['res'](req, res, 'content-length'),
      context: {
        parentId: req['context'].parentId,
        sampled: req['context'].sampled['value'],
        spanId: req['context'].spanId,
        traceId: req['context'].traceId,
      },
      httpVersion: tokens['http-version'](req, res),
      level: 'access',
      method: tokens['method'](req, res),
      referrer: tokens['referrer'](req, res),
      remoteAddress: tokens['remote-addr'](req, res),
      remoteHostname: req['hostname'],
      responseTimeMs: tokens['response-time'](req, res),
      serverHostname: serviceId || os.hostname(),
      status: tokens['status'](req, res),
      time: tokens['date'](req, res, 'iso'),
      url: tokens['url'](req, res),
      userAgent: tokens['user-agent'](req, res),
    };
    return JSON.stringify(message);
  }, {
    stream: {
      write: morganStream,
    },
  });
}

export interface CreateContextMiddlewareOptions {
  context: Context<TraceId>;
}

function createContextMiddleware({
  context,
}: CreateContextMiddlewareOptions): any {
  return (
    req: ContextualRequest,
    _res: Response,
    next: NextFunction
  ) => {
    const {parentId, sampled, spanId, traceId} = context.getContext();
    req.context = {parentId, sampled, spanId, traceId};
    next();
  };
}

export interface CreateCorsMiddlewareOptions {
  whitelist: string[];
}

function createCorsMiddleware({
  whitelist = [],
}: CreateCorsMiddlewareOptions): express.RequestHandler {
  return cors({
    origin: (origin, callback) => {
      if (origin === undefined || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        const corsError = new Error(`Origin "${origin}" is invalid.`);
        callback(corsError, false);
      }
    },
  });
}
