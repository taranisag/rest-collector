export class RestCollectorRequest {
    public headers: any;
    public constructor() {
        this.headers = {
            'Content-Type': 'application/json',
        };
    }
}
