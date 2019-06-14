# Reverest

## Installing
``` bash
$ npm install reverest
```
## Interface
```typescript
import { IRevresetResult } from "reverest";

interface IRevresetResult<E = any> {
    data: E;
    headers: any;
}
```

## API
### Basic APIs
Sending get request
```typescript
const client: RevrestClient = new RevrestClient("http://server/api/entity/{id}")
const result: IRevresetResult = await client.get();

console.log("data", result.data);
console.log("headers", result.headers);
```

Sending post request
```typescript
const client: RevrestClient = new RevrestClient("http://server/api/entity/{id}")
const result: IRevresetResult = await client.post({
    data: { name: "entity #1" }
});
```

Sending put request
```typescript
const client: RevrestClient = new RevrestClient("http://server/api/entity/{id}")
const result: IRevresetResult = await client.put({
    params: { id: 1 },
    data: { name: "entity #2" }
});
```
### Decorate Requests
In most scenarios you will want to add more meta data information for a specific requests such as, transaction id, authentication header or custom headers. 
```typescript
const requestDecorator: IDecorateRequest = {
    decorateRequest: (req: ReverestRequest, bag: any): void => {
        req.headers.Authorization = "yoursecret!";
        req.headers.transactionid = bag.transactionid;
    };
}
const client: RevrestClient = new RevrestClient("http://server/api/entity/{id}", requestDecorator);
const result = await client.get();
```