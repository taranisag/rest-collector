import { ReverestRequest } from "./ReverestRequest";

export interface IDecorateRequest<B> {
    decorateRequest(req: ReverestRequest, bag?: B): void;
}