import * as sift_lib_utils from 'sift/lib/utils';
import * as sift_lib_core from 'sift/lib/core';
import { Application, Service, FeathersService, Params, Paginated, Id, NullableId } from '@feathersjs/feathers';
import { Observable, OperatorFunction } from 'rxjs';

type ListStrategy = any;
interface Options {
    idField: string;
    dataField?: string;
    sorter?: (query: any, options: any) => any;
    /**
     * a filter function factory
     */
    matcher?: (query: any) => (element: any) => boolean;
    listStrategies?: {
        [name: string]: ListStrategy;
    };
    listStrategy?: 'always' | 'smart' | 'never' | string | ListStrategy;
    pipe?: OperatorFunction<any, any> | Array<OperatorFunction<any, any>>;
}
interface ReactiveServiceMixin<T> {
    created$: Observable<T>;
    updated$: Observable<T>;
    patched$: Observable<T>;
    removed$: Observable<T>;
    reset$: Observable<T>;
    never(source$: Observable<T>): Observable<T>;
    always(source$: Observable<T>, options: Options, args: any): Observable<T>;
    smart(source$: Observable<T>, options: Options, args: any): Observable<T>;
}
declare module '@feathersjs/feathers' {
    interface ServiceAddons<A = Application, S = Service> {
        watch(options?: Partial<Options>): ReactiveService<S>;
        rx(options?: Partial<Options>): FeathersService;
        reset(): void;
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

declare function strategies<T>(): ReactiveServiceMixin<T>;

declare function rx(options?: Options): (app: Application) => void;
declare namespace rx {
    var strategy: typeof strategies;
    var sift: <TItem, TSchema extends TItem = TItem>(query: sift.Query<TSchema>, options?: Partial<sift_lib_core.Options>) => (item: unknown, key?: sift_lib_utils.Key, owner?: any) => boolean;
}

export { Options, rx };
