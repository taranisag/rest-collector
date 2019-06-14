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
const resultArray: IRevresetResult = await client.get();

console.log("data", resultArray.data);
console.log("headers", resultArray.headers);

const singleData: IRevresetResult = await client.get({
    params: { id: 1 }
}).then((result) => { return result.data; });

console.log("data", singleData);
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

Sending delete request
```typescript
const client: RevrestClient = new RevrestClient("http://server/api/entity/{id}")
const result: IRevresetResult = await client.delete({
    params: { id: 1 }
});
```
### Adding Mappers
When using microservices architecture you will need to join entities in application level.
```typescript
const client: RevrestClient = new RevrestClient("http://server/api/entity/{id}");
client.addMapper({
    entityAttribute: "userId",
    restAPIAttribute: "id",
    restAPIURL: "http://secondserver/api/users",
    mergeEntities: (entity: any, possibleValue: any) => {
        if(possibleValue) {
            entity.email = possibleValue.email;
            return entity;
        }
    }
});
const result = await client.get();
console.log(result.data)
```
result:
```json
{
    "name": "entity #1",
    "email: "John@deo.com"
}
```

### Decorate Requests
In most scenarios you will want to add moremeta data information for a specific request such as: transaction id, authentication header or custom headers. 
```typescript
const requestDecorator: IDecorateRequest = {
    decorateRequest: (req: ReverestRequest, bag: any): void => {
        req.headers.Authorization = "yoursecret!";
        req.headers.transactionid = bag.transactionid;
    };
}
const client: RevrestClient = new RevrestClient("http://server/api/entity/{id}", requestDecorator);
const result = await client.get({
    bag: { transactionid = "transactionid" }
});
```