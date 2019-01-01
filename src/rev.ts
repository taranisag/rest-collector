"use strict";

const unirest: any = require("unirest");
import RestMapper from "./RestMapper";
import { Request } from "express";
import IDecorateRequest from "./IDecorateRequest";
import ReverestRequest from "./ReverestRequest";
import { promises } from "fs";
const extend: any = require("util")._extend;

export interface IRevresetOptions<B> {
    query: any;
    params: any;
    method: string;
    url: string;
    bag: B;
    data: any;
}

export default class EntityMerger<T, B> {
    private mappers: RestMapper<T, B>[];
    private entityRestAPI: string;

    constructor(entityRestAPI: string, private decorateRequests: IDecorateRequest<K>) {
        this.mappers = [];
        this.entityRestAPI = entityRestAPI;
    }

    public addMapper(mapper: RestMapper<T, B>): void {
        this.mappers.push(mapper);
    }

    public async fillData(entities: T[], options: any): Promise<void> {
        entities.forEach((entity: T) => {
            this.mappers.forEach((currentMapper: RestMapper<T, B>) => {
                currentMapper.collectData(entity);
            });
        });

        var queryPromises: Promise<any>[] = [];
        this.mappers.forEach((currentMapper: RestMapper<T, B>) => {
            queryPromises.push(currentMapper.queryData(this.decorateRequests, options));
        });

        const results: any[] = await Promise.all(queryPromises);

        entities.forEach(entity => {
            this.mappers.forEach(currentMapper => {
                currentMapper.mergeData(entity);
            });
        });
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

    public async sendRequest(options: IRevresetOptions<K>): Promise<any> {
        var req: ReverestRequest = new ReverestRequest();

        if (!options.url) {
            options.url = options.url || this.fillparams(this.entityRestAPI, options.params);
        }

        var httpreq:any = unirest[options.method](options.url);

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

                promise.then(function(results) {

                    if (options && options.transform && options.transform.after) {
                        results = options.transform.after(results);
                    }

                    return {
                        items: isArray ? results : results[0],
                        headers: response.headers
                    };

                }).then(resolve).catch(reject);
            } else {
                var error = new Error("Server side Error" + JSON.stringify({
                    data: options.data,
                    query: options.query,
                    url: options.url
                }));
                error.status = response.status;
                error.body = response.body;
                reject(error);
            }
        });
    }

    get(options) {
        return this.sendRequest(extend(options, {
            method: "get"
        }));
    }

    post(options) {
        return this.sendRequest(extend(options, {
            method: "post"
        })).then(function(result) {
            return {
                item: result.items,
                headers: result.headers
            }
        });
    }

    put(options) {
        return this.sendRequest(extend(options, {
            method: "put"
        })).then(function(result) {
            return {
                item: result.items,
                headers: result.headers
            }
        });
    }

    delete(options) {
        return this.sendRequest(extend(options, {
            method: "delete"
        })).then(function(result) {
            return {
                item: result.items,
                headers: result.headers
            }
        });
    }

    patch(options) {
        return this.sendRequest(extend(options, {
            method: "patch"
        })).then(function(result) {
            return {
                item: result.items,
                headers: result.headers
            }
        });
    }
}

module.exports = EntityMerger;