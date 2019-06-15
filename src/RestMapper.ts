'use strict';

import { DecorateRequest } from './DecorateRequest';
import { ReverestRequest } from './ReverestRequest';
import superagent from 'superagent';
import ReverestError from './ReverestError';

export interface RestMapperOptions<E> {
    entityAttribute: string;
    restAPIAttribute: string;
    restAPIURL: string;
    mergeEntities(entity: E, possibleValue: any): void;
    before?(payload: any): any;
    method?: string;
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

    public constructor(options: RestMapperOptions<E>) {
        this.entityAttribute = options.entityAttribute;
        this.restAPIAttribute = options.restAPIAttribute;
        this.restAPIURL = options.restAPIURL;
        this.dataLookup = {};
        this.mergeEntities = options.mergeEntities;
        this.before = options.before || ((payload: any) => payload);
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
        let query: any = {};
        if (this.method.toLowerCase() === 'get') {
            query[this.restAPIAttribute] = this.dataValues;
            query = this.before(query);
            getEnititesUrl.query(query);
        } else {
            this.dataValues = this.before(this.dataValues);
            getEnititesUrl.send(this.dataValues);
        }
        return new Promise<void>((resolve, reject) => {
            getEnititesUrl.end((err: any, response: any) => {
                if (response && response.status < 300) {
                    response.body.forEach((record: any) => {
                        this.dataLookup[record[this.restAPIAttribute]] = record;
                    });
                    resolve();
                } else {
                    reject(
                        new ReverestError(
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
