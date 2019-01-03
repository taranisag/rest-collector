"use strict";

const unirest: any = require("unirest");
import {RestMapper, IRestMapperOptions} from "./RestMapper";
import { IDecorateRequest } from "./IDecorateRequest";
import { ReverestRequest } from "./ReverestRequest";
import RevrestError from "./RevrestError";

export interface IRevresetOptions<B> {
    query?: any;
    params?: any;
    method?: string;
    url?: string;
    bag?: B;
    data?: any;
}

export class RevrestClient<E, B> {
    private mapperOptions: IRestMapperOptions<E>[];
    private entityRestAPI: string;

    constructor(entityRestAPI: string, private decorateRequests: IDecorateRequest<B>) {
        this.mapperOptions = [];
        this.entityRestAPI = entityRestAPI;
    }

    public addMapper(mapperOption: IRestMapperOptions<E>): void {
        this.mapperOptions.push(mapperOption);
    }

    public async fillData(entities: E[], options: any): Promise<any> {

        const mappers: RestMapper<E, B>[] = this.mapperOptions.map(m => new RestMapper<E, B>(m));

        entities.forEach((entity: E) => {
            mappers.forEach((currentMapper: RestMapper<E, B>) => {
                currentMapper.collectData(entity);
            });
        });

        var queryPromises: Promise<any>[] = [];
        mappers.forEach((currentMapper: RestMapper<E, B>) => {
            queryPromises.push(currentMapper.queryData(this.decorateRequests, options));
        });

        await Promise.all(queryPromises);

        entities.forEach(entity => {
            mappers.forEach(currentMapper => {
                currentMapper.mergeData(entity);
            });
        });

        return entities;
    }

    public fillparams(url: string, params: any): string {
        const regExp: RegExp = /(\{[^}]+\})/g;
        const matches: RegExpMatchArray | null = url.match(regExp);
        if(matches!=null) {
            for (let i: number = 0; i < matches.length; i++) {
                var str: string = matches[i];
                var key: string = str.replace("{", "").replace("}", "");

                var replacementValue: string = "";
                if (params) {
                    replacementValue = params[key];
                    if (replacementValue === undefined) {
                        replacementValue = "";
                    }
                }
                url = url.replace(str, replacementValue);
            }
        }
        return url;
    }

    public async sendRequest(options: IRevresetOptions<B>): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            var req: ReverestRequest = new ReverestRequest();

            if (!options.url) {
                options.url = options.url || this.fillparams(this.entityRestAPI, options.params);
            }
    
            var httpreq:any = unirest[options.method!](options.url);
    
            if (options && options.query) {
                httpreq.query(options.query);
            }
    
            // decorate transaction with additional data, such as: custom headers, different content type and cookies.
            if (this.decorateRequests) {
                this.decorateRequests.decorateRequest(req, options.bag);
            }
    
            // initialize final cookies before sending a request to the remote server
            httpreq.headers(req.headers);
            httpreq.send(options.data);
            httpreq.end((response: any) => {
                if (response.status < 300) {
                    var promise: Promise<any> | null = null;
                    var isArray: boolean = Array.isArray(response.body);
                    if (isArray) {
                        promise = this.fillData(response.body, options);
                    } else {
                        promise = this.fillData([response.body], options);
                    }

                    promise.then((results: any) => {
                        resolve({
                            items: isArray ? results : results[0],
                            headers: response.headers
                        });
                    }).catch(reject);                   
                } else {
                    throw new RevrestError(options.url!, response.status, response.body, options.query, options.data);
                }
            });
        });
    }

    public async get(options: IRevresetOptions<B>): Promise<any> {
        return this.sendRequest({
            ...options,
            method: "get"
        });
    }

    public async post(options: IRevresetOptions<B>): Promise<any> {
        const result: any = await this.sendRequest({
            ...options,
            method: "post"
        });
        
        return {
            item: result.items,
            headers: result.headers
        }
    }

    public async put(options: IRevresetOptions<B>): Promise<any> {
        const result: any = await this.sendRequest({
            ...options,
            method: "put"
        });
        
        return {
            item: result.items,
            headers: result.headers
        }
    }

    public async delete(options: IRevresetOptions<B>): Promise<any> {
        const result: any = await this.sendRequest({
            ...options,
            method: "delete"
        });
        
        return {
            item: result.items,
            headers: result.headers
        }
    }

    public async patch(options: IRevresetOptions<B>): Promise<any> {
        const result: any = await this.sendRequest({
            ...options,
            method: "patch"
        });
        
        return {
            item: result.items,
            headers: result.headers
        }
    }
}