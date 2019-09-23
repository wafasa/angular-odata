import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ODataService } from "../odata-service/odata.service";
import { ODataOptions } from './options';
import { ODataSegment, PlainObject, SegmentHandler } from './types';
import { ODataSegments } from './segments';

export type ODataObserve = 'body' | 'events' | 'response';

export abstract class ODataRequest {
  // URL QUERY PARTS
  public static readonly SEPARATOR = '&';

  // SEGMENT NAMES
  public static readonly METADATA = 'metadata';
  public static readonly ENTITY_KEY = 'entityKey';
  public static readonly TYPE_NAME = 'typeName';
  public static readonly PROPERTY = 'property';

  // CONSTANT SEGMENTS
  public static readonly $METADATA = '$metadata';
  public static readonly $COUNT = '$count';

  // VARIABLES
  protected service: ODataService;
  protected segments: ODataSegments;
  protected options: ODataOptions;

  constructor(
    service: ODataService,
    segments?: ODataSegment[],
    options?: PlainObject
  ) {
    this.service = service;
    this.segments = new ODataSegments(segments || []);
    this.options = new ODataOptions(options || {});
  }

  protected get(options: {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    observe?: ODataObserve,
    params?: HttpParams|{[param: string]: string | string[]},
    reportProgress?: boolean,
    responseType?: 'arraybuffer'|'blob'|'json'|'text'|'set'|'property',
    withCredentials?: boolean,
  } = {}): Observable<any> {
    return this.service.request("GET", this, options);
  }

  protected post(body: any|null, options: {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    observe?: ODataObserve,
    params?: HttpParams|{[param: string]: string | string[]},
    reportProgress?: boolean,
    responseType?: 'arraybuffer'|'blob'|'json'|'text'|'set'|'property',
    withCredentials?: boolean,
  } = {}): Observable<any> {
    return this.service.request("POST", this, Object.assign(options, {body}));
  }

  protected patch(body: any|null, etag?: string, options: {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    observe?: ODataObserve,
    params?: HttpParams|{[param: string]: string | string[]},
    reportProgress?: boolean,
    responseType?: 'arraybuffer'|'blob'|'json'|'text'|'set'|'property',
    withCredentials?: boolean,
  } = {}): Observable<any> {
    return this.service.request("PATCH", this, Object.assign(options, {body, etag}));
  }

  protected put(body: any|null, etag?: string, options: {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    observe?: ODataObserve,
    params?: HttpParams|{[param: string]: string | string[]},
    reportProgress?: boolean,
    responseType?: 'arraybuffer'|'blob'|'json'|'text'|'set'|'property',
    withCredentials?: boolean,
  } = {}): Observable<any> {
    return this.service.request("PUT", this, Object.assign(options, {body, etag}));
  }

  protected delete (etag?: string, options: {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    observe?: ODataObserve,
    params?: HttpParams|{[param: string]: string | string[]},
    reportProgress?: boolean,
    responseType?: 'arraybuffer'|'blob'|'json'|'text'|'set'|'property',
    withCredentials?: boolean,
  } = {}): Observable<any> {
    return this.service.request("DELETE", this, Object.assign(options, {etag}));
  }

  toString(): string {
    let path = this.path();
    let queryString = Object.entries(this.params())
      .map(e => `${e[0]}=${e[1]}`)
      .join("&");
    return queryString ? `${path}?${queryString}` : path
  }

  path(): string {
    return this.segments.path();
  }

  params(): PlainObject {
    return this.options.params();
  }

  clone<T extends ODataRequest>(type?: { new(service: ODataService, segments: ODataSegment[], options: PlainObject): T; }): T {
    if (!type) 
      type = this.constructor as { new(service: ODataService, segments: ODataSegment[], options: PlainObject): T; };
    let options = this.options.toObject();
    let segments = this.segments.toObject();
    return new type(this.service, segments, options);
  };

  toJSON() {
    return {
      segments: this.segments.toJSON(),
      params: this.options.toJSON()
    }
  }

  static fromJSON<T extends ODataRequest>(
    service: ODataService, 
    json: {segments: any[], options: PlainObject},
    type?: { new(service: ODataService, segments?: ODataSegment[], options?: PlainObject): T; }): T {
    if (!type) 
      type = this.constructor as { new(service: ODataService, segments?: ODataSegment[], options?: PlainObject): T; };
    return new type(service, json.segments, json.options);
  }

  is(type: string) {
    return this.segments.last().type === type;
  }
}
