import { Retries } from './RestCollectorClient';

export interface Timeout {
    deadline?: number;
    response?: number;
}

export interface RestCollectorSharedOptions {
    timeout?: number | Timeout;
    retry?: Retries;
    method?: string;
}
