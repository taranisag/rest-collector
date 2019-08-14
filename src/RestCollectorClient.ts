'use strict';

import superagent from 'superagent';
import { RestMapper, RestMapperOptions } from './RestMapper';
import { DecorateRequest } from './DecorateRequest';
import { RestCollectorRequest } from './RestCollectorRequest';
import RestCollectorError from './RestCollectorError';
import pRetry from 'p-retry';
import { TimeoutsOptions } from 'retry';
import { RestCollectorSharedOptions } from './RestCollectorSharedOptions';

export interface Retries extends TimeoutsOptions {
    onFailedAttempt?: (error: any) => void;
}

export interface RestCollectorOptions<B> extends RestCollectorSharedOptions {
    query?: any;
    params?: any;
    url?: string;
    bag?: B;
    data?: any;
}

export interface RestCollectorResult<E = any> {
    data: E;
    headers: any;
}

export class RestCollectorClient<E = any, B = any> {
    private mapperOptions: RestMapperOptions<E>[];
    private entityRestAPI?: string;
    private decorateRequests?: DecorateRequest<B>;

    public constructor(entityRestAPI?: string, decorateRequests?: DecorateRequest<B>) {
        this.mapperOptions = [];
        this.entityRestAPI = entityRestAPI;
        this.decorateRequests = decorateRequests;
    }

    public addMapper(mapperOption: RestMapperOptions<E>): void {
        this.mapperOptions.push(mapperOption);
    }

    protected async fillData(entities: E[], options: any): Promise<any> {
        const mappers: RestMapper<E, B>[] = this.mapperOptions.map(m => new RestMapper<E, B>(m));

        entities.forEach((entity: E) => {
            mappers.forEach((currentMapper: RestMapper<E, B>) => {
                currentMapper.collectData(entity);
            });
        });

        var queryPromises: Promise<any>[] = [];
        mappers.forEach((currentMapper: RestMapper<E, B>) => {
            if (currentMapper.retry) {
                queryPromises.push(
                    pRetry(currentMapper.queryData.bind(currentMapper, options.bag, this.decorateRequests), {
                        ...currentMapper.retry,
                    }),
                );
            } else {
                queryPromises.push(currentMapper.queryData(options.bag, this.decorateRequests));
            }
        });

        await Promise.all(queryPromises);

        entities.forEach(entity => {
            mappers.forEach(currentMapper => {
                currentMapper.mergeData(entity);
            });
        });

        return entities;
    }

    protected fillparams(url: string, params: any): string {
        const regExp = /(\{[^}]+\})/g;
        const matches: RegExpMatchArray | null = url.match(regExp);
        if (matches != null) {
            for (let i = 0; i < matches.length; i++) {
                var str: string = matches[i];
                var key: string = str.replace('{', '').replace('}', '');

                var replacementValue = '';
                if (params) {
                    replacementValue = params[key];
                    if (replacementValue === undefined) {
                        replacementValue = '';
                    }
                }
                url = url.replace(str, replacementValue);
            }
        }
        return url;
    }

    public sendRequest(options: RestCollectorOptions<B>): Promise<RestCollectorResult<E>> {
        return new Promise<any>((resolve, reject) => {
            var req: RestCollectorRequest = new RestCollectorRequest();

            if (!options.url && this.entityRestAPI) {
                options.url = options.url || this.fillparams(this.entityRestAPI, options.params);
            }

            //@ts-ignore
            var httpreq: any = superagent[options.method!](options.url);

            if (options && options.query) {
                httpreq.query(options.query);
            }

            // decorate transaction with additional data, such as: custom headers, different content type and cookies.
            if (this.decorateRequests) {
                this.decorateRequests.decorateRequest(req, options.bag);
            }

            // initialize final cookies before sending a request to the remote server
            for (let [key, value] of Object.entries(req.headers)) {
                httpreq.set({ [key]: value });
            }

            options.timeout && httpreq.timeout(options.timeout);
            httpreq.send(options.data);
            httpreq.end((err: any, response: any) => {
                if (response && response.status < 300) {
                    var promise: Promise<any> | null = null;
                    var isArray: boolean = Array.isArray(response.body);
                    if (isArray) {
                        promise = this.fillData(response.body, options);
                    } else {
                        promise = this.fillData([response.body], options);
                    }

                    promise
                        .then((results: any) => {
                            resolve({
                                data: isArray ? results : results[0],
                                headers: response.headers,
                                status: response.status,
                            });
                        })
                        .catch(reject);
                } else {
                    reject(
                        new RestCollectorError(
                            options.url!,
                            response ? response.status : err.toString(),
                            response ? response.body : err.toString(),
                            options.query,
                            options.data,
                        ),
                    );
                }
            });
        });
    }

    private async sendRetriedRequest(
        method: string,
        options?: RestCollectorOptions<B>,
    ): Promise<RestCollectorResult<E>> {
        const allOptions = options || {};
        const { retry, ...restCollectorOptions } = allOptions;
        if (retry) {
            return pRetry(this.sendRequest.bind(this, { ...restCollectorOptions, method: method }), { ...retry });
        }
        return this.sendRequest({ ...restCollectorOptions, method: method });
    }

    public async get(options?: RestCollectorOptions<B>): Promise<RestCollectorResult<E>> {
        return this.sendRetriedRequest('get', options);
    }

    public async post(options?: RestCollectorOptions<B>): Promise<RestCollectorResult<E>> {
        return this.sendRetriedRequest('post', options);
    }

    public async put(options?: RestCollectorOptions<B>): Promise<RestCollectorResult<E>> {
        return this.sendRetriedRequest('put', options);
    }

    public async delete(options?: RestCollectorOptions<B>): Promise<RestCollectorResult<E>> {
        return this.sendRetriedRequest('delete', options);
    }

    public async patch(options?: RestCollectorOptions<B>): Promise<RestCollectorResult<E>> {
        return this.sendRetriedRequest('patch', options);
    }
}
