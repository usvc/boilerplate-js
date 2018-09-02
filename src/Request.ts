import * as request from 'request';
import {Request, RequestCallback, Options as RequestOptions} from 'request';
import instrumentRequest = require('zipkin-instrumentation-request');
import { Tracer } from './Tracer';

export interface CreateRequestOptions {
  tracer: Tracer;
}
export type RequesterModule = 'request';

export type RequestRequester = (
  remoteServiceName: string,
  url: string,
  requestOptionsOrCallback: RequestOptions | RequestCallback,
  callback: RequestCallback,
) => Request;

export function createRequest({
  tracer
}: CreateRequestOptions): RequestRequester {
  return (
    remoteServiceName: string,
    url: string,
    requestOptionsOrCallback: RequestOptions | RequestCallback,
    callback: RequestCallback = () => {},
  ) => {
    const instrumentedRequest = instrumentRequest(request, {
      tracer,
      remoteServiceName: remoteServiceName || 'unknown',
    });
    switch (typeof requestOptionsOrCallback) {
      case 'function':
        return instrumentedRequest({
          url,
        }, typecastRequestCallback(requestOptionsOrCallback));
      case 'object':
        return instrumentedRequest({
          url,
          ...typecastRequestOptions(requestOptionsOrCallback),
        }, callback);
      default:
        // tslint:disable-next-line max-line-length
        throw new Error('The request options or the callback has to provided as the third argument.');
    }
  };
}

function typecastRequestCallback(
  requestOptionsOrCallback: any,
): request.RequestCallback {
  if (typeof requestOptionsOrCallback === 'function') {
    return requestOptionsOrCallback;
  } else {
    throw new Error('Provided request callback is not a valid function.');
  }
}

function typecastRequestOptions(
  requestOptionsOrCallback: any,
): RequestOptions {
  if (typeof requestOptionsOrCallback === 'object') {
    return requestOptionsOrCallback;
  } else {
    throw new Error('Provided request options is not a valid object.');
  }
}
