import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { ODataEntitySetResource, Filter, Expand, GroupBy, Select, OrderBy, ODataResource, ODataEntitySet } from '../resources';

import { ODataModel } from './model';
import { ODataNavigationPropertyResource } from '../resources/requests/navigationproperty';

export class ODataModelCollection<M extends ODataModel> implements Iterable<M> {
  static model: typeof ODataModel = null;
  query: ODataEntitySetResource<any> | ODataNavigationPropertyResource<any>;
  models: M[];

  state: {
    page?: number,
    pages?: number,
    size?: number,
    records?: number,
  };

  constructor(models: any[], query: ODataEntitySetResource<any> | ODataNavigationPropertyResource<any>) {
    this.models = this.parse(models, query);
    this.state = {
      records: this.models.length
    };
  }

  parse(models: any[], query: ODataEntitySetResource<any> | ODataNavigationPropertyResource<any>) {
    this.query = query
    let Ctor = <typeof ODataModelCollection>this.constructor;
    return models.map(model => new Ctor.model(model, (this.query.clone() as ODataEntitySetResource<any> | ODataNavigationPropertyResource<any>).entity()) as M);
  }

  toJSON() {
    return this.models.map(model => model.toJSON());
  }

  // Iterable
  public [Symbol.iterator]() {
    let pointer = 0;
    let models = this.models;
    return {
      next(): IteratorResult<M> {
        return {
          done: pointer === models.length,
          value: models[pointer++]
        };
      }
    }
  }

  assign(entitySet: ODataEntitySet<any>, query: ODataEntitySetResource<any> | ODataNavigationPropertyResource<any>) {
    this.state.records = entitySet.count;
    this.state.size = entitySet.value.length;
    this.state.pages = Math.ceil(this.state.records / this.state.size);
    this.models = this.parse(entitySet.value, query);
    return this;
  }

  fetch(): Observable<this> {
    let query: ODataEntitySetResource<any> | ODataNavigationPropertyResource<any> = this.query.clone<any>() as ODataEntitySetResource<any> | ODataNavigationPropertyResource<any>;
    if (!this.state.page)
      this.state.page = 1;
    if (this.state.size) {
      query.top(this.state.size);
      query.skip(this.state.size * (this.state.page - 1));
    }
    return query.get({ responseType: 'entityset', withCount: true })
      .pipe(
        map(set => set ? this.assign(set, query) : this)
      );
  }

  getPage(page: number) {
    this.state.page = page;
    return this.fetch();
  }

  getFirstPage() {
    return this.getPage(1);
  }

  getPreviousPage() {
    return (this.state.page) ? this.getPage(this.state.page - 1) : this.fetch();
  }

  getNextPage() {
    return (this.state.page) ? this.getPage(this.state.page + 1) : this.fetch();
  }

  getLastPage() {
    return (this.state.pages) ? this.getPage(this.state.pages) : this.fetch();
  }

  setPageSize(size: number) {
    this.state.size = size;
    if (this.state.records) {
      this.state.pages = Math.ceil(this.state.records / this.state.size);
      if (this.state.page > this.state.pages)
        this.state.page = this.state.pages;
    }
  }

  // Mutate query
  select(select?: Select) {
    return (this.query as ODataEntitySetResource<any>).select(select);
  }

  filter(filter?: Filter) {
    return (this.query as ODataEntitySetResource<any>).filter(filter);
  }

  search(search?: string) {
    return (this.query as ODataEntitySetResource<any>).search(search);
  }

  orderBy(orderBy?: OrderBy) {
    return (this.query as ODataEntitySetResource<any>).orderBy(orderBy);
  }

  expand(expand?: Expand) {
    return (this.query as ODataEntitySetResource<any>).expand(expand);
  }

  groupBy(groupBy?: GroupBy) {
    return (this.query as ODataEntitySetResource<any>).groupBy(groupBy);
  }
}
