'use strict';

import { DecorateRequest } from './DecorateRequest';
import { ReverestRequest } from './ReverestRequest';
import superagent from 'superagent';

export interface RestMapperOptions<E> {
    entityAttribute: string;
    restAPIAttribute: string;
    restAPIURL: string;
    mergeEntities(entity: E, possibleValue: any): void;
    method?: string;
}

export class RestMapper<E, B> {
    private entityAttribute: string;
    private restAPIAttribute: string;
    private restAPIURL: string;
    private dataValues: any[] = [];
    private mergeEntities: (entity: E, possibleValue: any) => void;
    public dataLookup: any;
    private method: string;

    public constructor(options: RestMapperOptions<E>) {
        this.entityAttribute = options.entityAttribute;
        this.restAPIAttribute = options.restAPIAttribute;
        this.restAPIURL = options.restAPIURL;
        this.dataLookup = {};
        this.mergeEntities = options.mergeEntities;
        this.method = options.method || 'get';
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
        const req: ReverestRequest = new ReverestRequest();
        //@ts-ignore
        var getEnititesUrl = superagent[this.method](this.restAPIURL);
        if (decorateCallback) {
            decorateCallback.decorateRequest(req, bag);
        }

        for (let [key, value] of Object.entries(req.headers)) {
            getEnititesUrl.set({ [key]: value });
        }

        if (this.method === 'get') {
            const query: any = {};
            query[this.restAPIAttribute] = this.dataValues;
            getEnititesUrl.query(query);
        } else {
            getEnititesUrl.send(this.dataValues);
        }
        const self: RestMapper<E, B> = this;

        return new Promise<void>((resolve, reject) => {
            getEnititesUrl.end(function(err: any, response: any): void {
                if (response.status < 300) {
                    response.body.forEach((record: any) => {
                        self.dataLookup[record[self.restAPIAttribute]] = record;
                    });
                    resolve();
                } else {
                    reject(response);
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
