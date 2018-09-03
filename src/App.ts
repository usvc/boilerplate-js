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

export interface ContextualRequest extends Request {
  context: {
    parentId: string,
    spanId: string,
    traceId: string,
    sampled: option.IOption<boolean>,
  };
}

export interface CreateAppOptions {
  accessLoggingBypassUrls?: string[];
  cookieSessionName?: string;
  context: Context<TraceId>;
  corsWhitelist?: string[];
  cspChildSrc?: string[];
  cspConnectSrc?: string[];
  cspDefaultSrc?: string[];
  cspFontSrc?: string[];
  cspFrameSrc?: string[];
  cspImgSrc?: string[];
  cspMediaSrc?: string[];
  cspObjectSrc?: string[];
  cspReportUri?: string;
  cspScriptSrc?: string[];
  cspStyleSrc?: string[];
  enableCors?: boolean;
  enableCsp?: boolean;
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
  accessLoggingBypassUrls = [],
  cookieSessionName = DEFAULT_SERVICE_ID,
  context,
  corsWhitelist = [],
  cspChildSrc = DEFAULT_CSP_CHILD_SRC,
  cspConnectSrc = DEFAULT_CSP_CONNECT_SRC,
  cspDefaultSrc = DEFAULT_CSP_DEFAULT_SRC,
  cspFontSrc = DEFAULT_CSP_FONT_SRC,
  cspFrameSrc = DEFAULT_CSP_FRAME_SRC,
  cspImgSrc = DEFAULT_CSP_IMG_SRC,
  cspMediaSrc = DEFAULT_CSP_MEDIA_SRC,
  cspObjectSrc = DEFAULT_CSP_OBJECT_SRC,
  cspReportUri = DEFAULT_CSP_REPORT_URI,
  cspScriptSrc = DEFAULT_CSP_SCRIPT_SRC,
  cspStyleSrc = DEFAULT_CSP_STYLE_SRC,
  enableCors = true,
  enableCsp = true,
  jsonBodyContentType = DEFAULT_JSON_BODY_CONTENT_TYPE,
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
  urlEncodedBodyContentType = DEFAULT_URL_ENCODED_BODY_CONTENT_TYPE,
  urlEncodedBodySizeLimit = DEFAULT_BODY_SIZE_LIMIT,
}: CreateAppOptions) {
  const app = express();
  promBundle.promClient.register.clear();
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
  app.use(helmet((enableCsp) ? {
    contentSecurityPolicy: {
      browserSniff: true,
      directives: {
        childSrc: cspChildSrc,
        connectSrc: cspConnectSrc,
        defaultSrc: cspDefaultSrc,
        fontSrc: cspFontSrc,
        frameSrc: cspFrameSrc,
        imgSrc: cspImgSrc,
        mediaSrc: cspMediaSrc,
        objectSrc: cspObjectSrc,
        reportUri: cspReportUri,
        scriptSrc: cspScriptSrc,
        styleSrc: cspStyleSrc,
      },
    },
  } : undefined));
  app.use(zipkinInstrumentationExpress({tracer}));
  app.use(createContextMiddleware({context}));
  if (enableCors) {
    app.use(createCorsMiddleware({whitelist: corsWhitelist}));
  }
  app.use(cookieParser());
  app.use(cookieSession({
    name: cookieSessionName,
    keys: ['', ''],
  }));
  app.use(createAccessLoggerMiddleware({
    serviceId,
    morganStream,
    accessLoggingBypassUrls,
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
  app.post(cspReportUri, (req,res ) => {
    logger.error(req.body);
    res.status(200).send();
  });

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
  accessLoggingBypassUrls: string[];
}

function createAccessLoggerMiddleware({
  serviceId,
  morganStream,
  accessLoggingBypassUrls,
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
    skip: (req) => {
      return (accessLoggingBypassUrls.indexOf(req.url) !== -1);
    },
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

class CorsError extends Error {
  status: number;

  constructor(message: any) {
    super(message);
    this.status = 401;
    return this;
  }
}

function createCorsMiddleware({
  whitelist = [],
}: CreateCorsMiddlewareOptions): express.RequestHandler {
  return cors({
    origin: (origin, callback) => {
      if (origin === undefined || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        const corsError = new CorsError(`Origin "${origin}" is invalid.`);
        corsError.status = 401;
        callback(corsError, false);
      }
    },
  });
}
