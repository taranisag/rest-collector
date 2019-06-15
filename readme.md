# Reverest
> Reverest is a Node.js and browser http library that allows you to merge data from multiple api endpoints. By adding multiple mappers (explenation bellow), the library allows you to join data from multiple sources into a single entity.
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
});

console.log("data", singleData.data);
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
When using microservices architecture you will need to join data from entities in the application level.
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
    "email": "John@deo.com"
}
```

The mapper will join data from both apis, based on the entityAttribute and restAPIAttribute we defined before.
addMapper api: 
* `entityAttribute`: The attribute of the base api on which the joining of the data will take place.
* `restAPIAttribute`: The attribute of the other api on which the joining of the data will take place.
* `restAPIURL`: The endpoint of the other api.
* `before?`: optional - a function which receives the query(get method) or payload (other http methods) and returns a new query/payload to be sent to the other api. This is usefull when you need to adjust the query/payload that you send to the api.
* `method?`: optional - the http method for the second api. Defaults to `get`.

You can add more than one mapper to join data from more than one other api.

### Adding More Than One Mapper with before method
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
client.addMapper({
    entityAttribute: "userId",
    restAPIAttribute: "id",
    restAPIURL: "http://thirdserver/api/users-courses",
    method: "post",
    before: payload => {
        return {
            otherDataForTheApi: [1, 2, 3],
            users: payload,
        };
    },
    mergeEntities: (entity: any, possibleValue: any) => {
        if(possibleValue) {
            entity.course = possibleValue.course;
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
    "email": "John@deo.com",
    "course": "Mathematics"
}
```

### Decorate Requests
In most scenarios you will want to add more meta data information for a specific request such as: transaction id, authentication header or custom headers. 
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

### More Usage Examples - https://github.com/taranisag/reverest/blob/master/tests/test.ts
