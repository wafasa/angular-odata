import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ODataClient } from "../client";
import { EntityKey } from '../types';
import { ODataModel, ODataCollection } from '../models';
import { ODataBaseService } from './base';

@Injectable()
export class ODataModelService<T, M extends ODataModel<T>, C extends ODataCollection<T, M>> extends ODataBaseService<T> {
  constructor(protected client: ODataClient) { super(client); }

  // Models
  public model(entity?: Partial<T>): M {
    return this.entity(entity).toModel<M>(entity);
  }

  public collection(models?: Partial<T>[]): C {
    return this.entities().toCollection<C>(models);
  }

  public fetchCollection(): Observable<C> {
    return this.collection().fetch();
  }

  public fetchModel(key?: EntityKey<T>): Observable<M> {
    return this.model(key as Partial<T>).fetch();
  }

  public attach(value: M): M;
  public attach(value: C): C;
  public attach(value: any): any {
    if (value instanceof ODataModel) {
      return value.attach(this.entities().entity(value.toEntity()));
    } else if (value instanceof ODataCollection) {
      return value.attach(this.entities());
    }
  }
}
