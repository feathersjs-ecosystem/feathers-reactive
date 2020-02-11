// Type definitions for feathers-reactive 0.5
// Project: https://github.com/feathersjs-ecosystem/feathers-reactive
// Definitions by: Jan Lohage <https://github.com/j2L4e>
// Definitions: https://github.com/feathersjs-ecosystem/feathers-reactive

// TypeScript Version: 2.1

import { Observable, OperatorFunction } from 'rxjs';
import { Id, NullableId, Paginated, Params } from '@feathersjs/feathers';

declare function FeathersReactive(options: FeathersReactive.Options): () => void;
export = FeathersReactive;

declare namespace FeathersReactive {
  type ListStrategy = any;

  // TODO: check for completeness
  interface Options {
    idField: string;
    dataField?: string;
    sorter?: (query: any, options: any) => any;

    /**
     * a filter function factory
     */
    matcher?: (query: any) => (element: any) => boolean;

    listStrategies?: { [name: string]: ListStrategy };
    listStrategy?: 'always' | 'smart' | 'never' | string | ListStrategy;
    pipe?: OperatorFunction<any, any> | Array<OperatorFunction<any, any>>;
  }
}

declare module '@feathersjs/feathers' {
  interface ServiceAddons<T> {
    watch(options?: Partial<FeathersReactive.Options>): ReactiveService<T>;
    rx(options?: Partial<FeathersReactive.Options>): Service<T>;
  }

  interface ReactiveService<T> {
    /**
     * Retrieves a list of all resources from the service.
     * Provider parameters will be passed as params.query
     */
    find(params?: Params): Observable<T | T[] | Paginated<T>>;

    /**
     * Retrieves a single resource with the given id from the service.
     */
    get(id: Id | string, params?: Params): Observable<T>;

    /**
     * Creates a new resource with data.
     */
    create(data: Partial<T[]>, params?: Params): Observable<T[]>;
    create(data: Partial<T>, params?: Params): Observable<T>;

    /**
     * Replaces the resource identified by id with data.
     * Update multiples resources with id equal `null`
     */
    update(id: NullableId, data: T, params?: Params): Observable<T | T[]>;

    /**
     * Merges the existing data of the resource identified by id with the new data.
     * Implement patch additionally to update if you want to separate between partial and full updates and support the PATCH HTTP method.
     * Patch multiples resources with id equal `null`
     */
    patch(id: NullableId, data: Partial<T>, params?: Params): Observable<T | T[]>;

    /**
     * Removes the resource with id.
     * Delete multiple resources with id equal `null`
     */
    remove(id: NullableId, params?: Params): Observable<T | T[]>;
  }
}
