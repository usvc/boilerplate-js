import * as winston from 'winston';
import * as TransportStream from 'winston-transport';
import {TransformFunction} from "logform";
import {Context, TraceId} from 'zipkin';
import {TracerService} from './Tracer';

export type Logger = winston.Logger;
export type LoggerModule = 'winston';

export interface CreateLoggerOptions {
  context: Context<TraceId>;
  formats: TransformFunction[];
  level: string;
  logsCollatorTransport: TransportStream;
  tracer: TracerService;
  transports?: TransportStream[];
}

export function createLogger({
  context,
  formats = [],
  level = 'info',
  logsCollatorTransport,
  tracer = 'zipkin',
  transports = [],
}: CreateLoggerOptions) {
  return winston.createLogger({
    level,
    format: winston.format.combine(
      ...formats.map(winston.format).map((f) => f()),
      winston.format((info) => {
        const currentContext = context.getContext();
        if (currentContext) {
          const {parentId, sampled, spanId, traceId} = currentContext;
          info['context'] = {
            parentId,
            sampled: sampled['value'],
            spanId,
            traceId
          };
        }
        if (typeof info.message !== 'string') {
          info[typeof info.message] = info.message;
          info.message = typeof info.message;
        }
        return info;
      })(),
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports: [
      ...transports,
      logsCollatorTransport,
      new winston.transports.Console(),
    ],
  });
}