'use strict';

import { DecorateRequest } from './DecorateRequest';
import { RestCollectorRequest } from './RestCollectorRequest';
import superagent from 'superagent';
import RestCollectorError from './RestCollectorError';
import { Retries } from './RestCollectorClient';

export interface RestMapperOptions<E> {
    entityAttribute: string;
    restAPIAttribute: string;
    restAPIURL: string;
    mergeEntities(entity: E, possibleValue: any): void;
    before?(payload: any): any;
    method?: string;
    retry?: Retries;
    timeout?: any;
}

export class RestMapper<E, B> {
    private entityAttribute: string;
    private restAPIAttribute: string;
    private restAPIURL: string;
    private dataValues: any[] = [];
    private mergeEntities: (entity: E, possibleValue: any) => void;
    private before: (payload: any) => any;
    private dataLookup: any;
    private method: string;
    private timeout?: any;
    public retry?: Retries;

    public constructor(options: RestMapperOptions<E>) {
        this.entityAttribute = options.entityAttribute;
        this.restAPIAttribute = options.restAPIAttribute;
        this.restAPIURL = options.restAPIURL;
        this.dataLookup = {};
        this.mergeEntities = options.mergeEntities;
        this.before = options.before || ((payload: any) => payload);
        this.method = options.method || 'get';
        this.timeout = options.timeout || undefined;
        this.retry = options.retry || undefined;
    }

    public collectData(entity: E): void {
        const dataHashtable: Map<any, boolean> = new Map<any, boolean>();
        const currentVal: any = (entity as any)[this.entityAttribute];
        if (!dataHashtable.get(currentVal)) {
            dataHashtable.set(currentVal, true);
            this.dataValues.push(currentVal);
        }
    }

    public async queryData(bag?: B, decorateCallback?: DecorateRequest<B>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const req: RestCollectorRequest = new RestCollectorRequest();
            //@ts-ignore
            var getEnititesUrl = superagent[this.method](this.restAPIURL);
            if (decorateCallback) {
                decorateCallback.decorateRequest(req, bag);
            }

            for (let [key, value] of Object.entries(req.headers)) {
                getEnititesUrl.set({ [key]: value });
            }

            this.timeout && getEnititesUrl.timeout(this.timeout);

            let query: any = {};
            if (this.method.toLowerCase() === 'get') {
                query[this.restAPIAttribute] = this.dataValues;
                query = this.before(query);
                getEnititesUrl.query(query);
            } else {
                this.dataValues = this.before(this.dataValues);
                getEnititesUrl.send(this.dataValues);
            }

            getEnititesUrl.end((err: any, response: any) => {
                if (response && response.status < 300) {
                    response.body.forEach((record: any) => {
                        this.dataLookup[record[this.restAPIAttribute]] = record;
                    });
                    resolve();
                } else {
                    reject(
                        new RestCollectorError(
                            this.restAPIURL,
                            response ? response.status : err.toString(),
                            response ? response.body : err.toString(),
                            query,
                            this.dataValues,
                        ),
                    );
                }
            });
        });
    }

    public mergeData(entity: E): void {
        const entityFieldData: any = (entity as any)[this.entityAttribute];
        const possibleValue: any = this.dataLookup[entityFieldData];
        this.mergeEntities(entity, possibleValue);
    }
}
