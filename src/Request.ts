import * as request from 'request';
import {Request, Options as RequestOptions} from 'request';
import instrumentRequest = require('zipkin-instrumentation-request');
import { Tracer } from './Tracer';

export interface CreateRequestOptions {
  tracer: Tracer;
}
export type RequesterModule = 'request';
export type RequestRequesterCallback = (
  error?: any,
  response?: object,
  body?: any,
) => any;

export type RequestRequester = (
  remoteServiceName: string,
  url: string,
  requestOptionsOrCallback: RequestOptions | RequestRequesterCallback,
  callback: RequestRequesterCallback,
) => Request;

export function createRequest({
  tracer
}: CreateRequestOptions): RequestRequester {
  return (
    remoteServiceName: string,
    url: string,
    requestOptionsOrCallback: RequestOptions | RequestRequesterCallback,
    callback: RequestRequesterCallback = () => {},
  ) => {
    const instrumentedRequest = instrumentRequest(request, {
      tracer,
      remoteServiceName: remoteServiceName || 'unknown',
    });
    switch (typeof requestOptionsOrCallback) {
      case 'function':
        return instrumentedRequest({
          url,
        }, callback);
      case 'object':
        return instrumentedRequest({
          url,
          ...requestOptionsOrCallback,
        }, callback);
      default:
        throw new Error('A callback has to provided as the third argument.');
    }
    
  };
}
