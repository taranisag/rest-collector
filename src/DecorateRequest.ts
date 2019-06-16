import { ReverestRequest } from './ReverestRequest';

export interface DecorateRequest<B> {
    decorateRequest(req: ReverestRequest, bag?: B): void;
}
