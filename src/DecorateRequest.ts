import { RestCollectorRequest } from './RestCollectorRequest';

export interface DecorateRequest<B> {
    decorateRequest(req: RestCollectorRequest, bag?: B): void;
}
