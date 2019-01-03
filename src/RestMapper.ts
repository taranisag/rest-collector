"use strict";

import { IDecorateRequest } from "./IDecorateRequest";
import { ReverestRequest } from "./ReverestRequest";
const unirest: any = require("unirest");


export interface IRestMapperOptions<E> {
	entityAttribute: string;
	restAPIAttribute: string;
	restAPIURL: string;
	mergeEntities(entity: E, possibleValue: any): void;
}

export class RestMapper<E, B> {

	private entityAttribute: string;
	private restAPIAttribute: string;
	private restAPIURL: string;
	private dataValues: any[] = [];
	private mergeEntities: (entity: E, possibleValue: any) => void;
	public dataLookup: any;

	constructor(options: IRestMapperOptions<E>) {
		this.entityAttribute = options.entityAttribute;
		this.restAPIAttribute = options.restAPIAttribute;
		this.restAPIURL = options.restAPIURL;
		this.dataLookup = {};
		this.mergeEntities = options.mergeEntities;
	}

	public collectData(entity: E): void {
		const dataHashtable: Map<any, boolean> = new Map<any, boolean>();
		const currentVal: any = (entity as any)[this.entityAttribute];
		if(!dataHashtable.get(currentVal)) {
			dataHashtable.set(currentVal, true);
			this.dataValues.push(currentVal);
		}
	}

	public async queryData(decorateCallback: IDecorateRequest<B>, bag: B): Promise<void> {
		const req: ReverestRequest = new ReverestRequest();
		var getEnititesUrl: any = unirest.get(this.restAPIURL);
		decorateCallback.decorateRequest(req, bag);

		getEnititesUrl.headers(req.headers);
		const query: any = {};
		query[this.restAPIAttribute] = this.dataValues;
		getEnititesUrl.query(query);
		const self: RestMapper<E, B> = this;

		return new Promise<void>((resolve, reject) => {
			getEnititesUrl.end(function(response: any): void {
				if(response.status < 300) {
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