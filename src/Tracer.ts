import {
  BatchRecorder,
  ExplicitContext,
  jsonEncoder,
  sampler as Sampler,
  Tracer,
  Context,
  TraceId
} from 'zipkin';
import {HttpLogger} from 'zipkin-transport-http';

export type Tracer = Tracer;
export type TracerService = 'zipkin';
export interface CreateTracerOptions {
  context: Context<TraceId>;
  headers?: object;
  host?: string;
  port?: string;
  sampleFrequency?: number;
  scheme?: string;
}

export function createTracer({
  context,
  headers = {},
  host = 'localhost',
  port = '9411',
  scheme = 'http',
  sampleFrequency = 1.0,
}: CreateTracerOptions): Tracer {
    return new Tracer({
      ctxImpl: context,
      recorder: new BatchRecorder({
        logger: new HttpLogger({
          endpoint: `${scheme}://${host}${port ? `:${port}` : ''}` +
            '/api/v2/spans',
          headers,
          httpInterval: 1000,
          httpTimeout: 5000,
          jsonEncoder: jsonEncoder.JSON_V2,
        }),
      }),
      sampler: new Sampler.CountingSampler(sampleFrequency),
      traceId128Bit: true,
    });
}
