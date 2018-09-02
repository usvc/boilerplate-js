import * as request from 'request';
import {Request, Options as RequestOptions} from 'request';
import instrumentRequest = require('zipkin-instrumentation-request');
import { Tracer } from './Tracer';

export interface CreateRequestOptions {
  tracer: Tracer;
}
export type RequesterModule = 'request';
export type RequestRequester = (
  remoteServiceName: string,
  url: string,
  requestOptions: RequestOptions,
) => Request;

export function createRequest({
  tracer
}: CreateRequestOptions): RequestRequester {
  return (
    remoteServiceName: string,
    url: string,
    requestOptions: RequestOptions,
  ) => {
    const instrumentedRequest = instrumentRequest(request, {
      tracer,
      remoteServiceName: remoteServiceName || 'unknown',
    });
    return instrumentedRequest({
      url,
      ...requestOptions,
    });
  };
}
