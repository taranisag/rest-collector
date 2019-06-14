import { ReverestRequest } from "./ReverestRequest";

export interface IDecorateRequest<B = any> {
    decorateRequest(req: ReverestRequest, bag?: B): void;
}