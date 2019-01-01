"use strict";

import IDecorateRequest from "./IDecorateRequest";
import { Request } from "express";
import ReverestRequest from "./ReverestRequest";
const unirest: any = require("unirest");


export interface IRestMapperOptions {
	entityAttribute: string;
	restAPIAttribute: string;
	restAPIURL: string;
}

export default abstract class RestMapper<E, K> {

	private entityAttribute: string;
	private restAPIAttribute: string;
	private restAPIURL: string;
	private dataValues: any[] = [];
	public dataLookup: any;


	protected abstract mergeEntities(entity: E, possibleValue: any): void;

	constructor(options: IRestMapperOptions) {
		this.entityAttribute = options.entityAttribute;
		this.restAPIAttribute = options.restAPIAttribute;
		this.restAPIURL = options.restAPIURL;
		this.dataLookup = {};
	}

	public collectData(entity: E): void {
		const dataHashtable: Map<any, boolean> = new Map<any, boolean>();
		const currentVal: any = (entity as any)[this.entityAttribute];
		if(!dataHashtable.get(currentVal)) {
			dataHashtable.set(currentVal, true);
			this.dataValues.push(currentVal);
		}
	}

	public async queryData(decorateCallback: IDecorateRequest<K>, bag: K): Promise<void> {
		const req: ReverestRequest = new ReverestRequest();
		var getEnititesUrl: any = unirest.get(this.restAPIURL);
		decorateCallback.decorateRequest(req, bag);

		getEnititesUrl.headers(req.headers);
		const query: any = {};
		query[this.restAPIAttribute] = this.dataValues;
		getEnititesUrl.query(query);
		const self: RestMapper<E, K> = this;

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