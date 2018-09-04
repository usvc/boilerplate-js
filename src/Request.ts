import * as Case from 'case';
import * as fetch from 'node-fetch';
import instrumentFetch = require('zipkin-instrumentation-fetch');
import instrumentRequest = require('zipkin-instrumentation-request');
import * as request from 'request';
import {RequestCallback, Options as RequestOptions} from 'request';
import {Tracer} from './Tracer';
import * as URL from 'url';


export type RequesterModule = 'request' | 'fetch';

export interface FetchRequesterOptions extends fetch.Request {
  remoteServiceName?: string;
}

export type FetchRequester = (
  url: string,
  fetchOptions: FetchRequesterOptions,
) => Promise<fetch.Response>;

export interface CreateFetchOptions {
  tracer: Tracer;
}

export function createFetch({
  tracer
}: CreateFetchOptions): FetchRequester {
  return (url, fetchOptions) => {
    const parsedUrl = URL.parse(url);
    const {host} = parsedUrl;
    const remoteServiceName =
      fetchOptions.remoteServiceName
      || Case.kebab(host ? host : 'unknown');
    return instrumentFetch(
      fetch,
      {tracer, remoteServiceName},
    )(url, fetchOptions);
  };
}


export type RequestRequester = (
  remoteServiceName: string,
  url: string,
  requestOptionsOrCallback: RequestOptions | RequestCallback,
  callback: RequestCallback,
) => request.Request;

export interface CreateRequestOptions {
  tracer: Tracer;
}

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
