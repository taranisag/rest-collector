export default class RevrestError extends Error {


    constructor(public url: string, public status: number, public response: any, public query: any, public data: any) {
        super();
    }
}