import { HttpParams, HttpHeaders } from '@angular/common/http';

import { ODataPathSegments, SegmentTypes, SegmentOptionTypes } from '../segments';
import { ODataQueryOptions, QueryOptionTypes } from '../options';
import { ODataClient } from '../../client';
import { PlainObject, $COUNT } from '../../types';
import { Parser } from '../../models';
import { ODataCallableResource } from './callable';
import { ODataEntityAnnotations, ODataCollectionAnnotations, ODataPropertyAnnotations } from '../responses/annotations';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Types } from '../../utils';

export class ODataFunctionResource<T> extends ODataCallableResource<T> {

  // Factory
  static factory<R>(name: string, service: ODataClient, opts?: {
      segments?: ODataPathSegments, 
      options?: ODataQueryOptions,
      parser?: Parser<R>}
  ) {
    let segments = opts && opts.segments || new ODataPathSegments();
    let options = opts && opts.options || new ODataQueryOptions();
    let parser = opts && opts.parser || null;

    segments.segment(SegmentTypes.functionCall, name);
    options.keep(QueryOptionTypes.format);
    return new ODataFunctionResource<R>(service, segments, options, parser);
  }

  // Parameters
  parameters(params?: PlainObject) {
    let segment = this.segments.last();
    if (!segment)
      throw new Error(`FunctionResourse dosn't have segment`);
    if (Types.isUndefined(params))
      return segment.option(SegmentOptionTypes.parameters);
    
    return segment.option(SegmentOptionTypes.parameters, params);
  }

  //GET
  get(options?: {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    params?: HttpParams|{[param: string]: string | string[]},
    reportProgress?: boolean,
    responseType?: 'entity',
    withCredentials?: boolean,
  }): Observable<[T, ODataEntityAnnotations]>;

  get(options?: {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    params?: HttpParams|{[param: string]: string | string[]},
    reportProgress?: boolean,
    responseType?: 'entities',
    withCredentials?: boolean,
    withCount?: boolean
  }): Observable<[T[], ODataCollectionAnnotations]>;

  get(options?: {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    params?: HttpParams|{[param: string]: string | string[]},
    reportProgress?: boolean,
    responseType?: 'property',
    withCredentials?: boolean,
  }): Observable<[T, ODataPropertyAnnotations]>;

  get(options?: {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    params?: HttpParams|{[param: string]: string | string[]},
    responseType?: 'entity'|'entities'|'property',
    reportProgress?: boolean,
    withCredentials?: boolean,
    withCount?: boolean
  }): Observable<any> {

    let params = options && options.params;
    if (options && options.withCount)
      params = this.client.mergeHttpParams(params, {[$COUNT]: 'true'})

    let res$ = this.client.get<T>(this, {
      headers: options && options.headers,
      observe: 'body',
      params: params,
      responseType: 'json',
      reportProgress: options && options.reportProgress,
      withCredentials: options && options.withCredentials
    });
    if (options && options.responseType) {
      switch (options.responseType) {
        case 'entity':
          return res$.pipe(map((body: any) => this.toEntity(body)));
        case 'entities':
          return res$.pipe(map((body: any) => this.toEntities(body)));
        case 'property':
          return res$.pipe(map((body: any) => this.toValue(body)));
      }
    }
    return res$;
  }
}
