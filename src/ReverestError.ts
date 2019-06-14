export default class ReverestError extends Error {
    public constructor(
        public readonly url: string,
        public readonly status: number,
        public readonly response: any,
        public readonly query: any,
        public readonly data: any,
    ) {
        super(`Request failed with status code ${status}`);
    }
}
