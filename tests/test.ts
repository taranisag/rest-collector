import { expect, assert } from "chai";
import express, { Request, Response} from "express";
import bodyParser from "body-parser";
import {RevrestClient, IRevresetOptions,IRestMapperOptions, RestMapper, IDecorateRequest, ReverestRequest} from "./../src/index"
import { Server } from "http";
import ReverestError from "../src/ReverestError";
const app = express()
// support parsing of application/json type post data
app.use(bodyParser.json());
const port = 3000;


interface ITagEntity {
    id: number;
    userId: number;
    email?: string;
}

interface IUserEntity {
    id: number;
    email: string;
}

interface IBag {
    userId: string;
}

class DecorateRequest implements IDecorateRequest<IBag>{
    decorateRequest(req: ReverestRequest, bag: IBag): void {
        req.headers.userId = bag.userId;
    }
}

const tagEntitiesArray = [{
    id: 1,
    userId: 3
},
{
    id: 2,
    userId: 4
}];
app.get('/api/tags/:id(\\d+)', (req: Request, res: Response) => {
    res.send(tagEntitiesArray.filter(x=> x.id ===  +req.params.id));
});


app.post('/api/tags', (req: Request, res: Response) => {
    
    var indexOfMaxValue = tagEntitiesArray.map(x=> x.id).reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
    const newTag = {
        ...req.body,
        id: indexOfMaxValue++
    };
    tagEntitiesArray.push(newTag);
    res.send(newTag);
});


app.get('/api/tags', (req: Request, res: Response) => {
    res.send(tagEntitiesArray);
});


app.get('/api/users', (req: Request, res: Response) => {
    res.send([{
        id: 3,
        email: "user3@taranis.ag"
    },
    {
        id: 4,
        email: "user4@taranis.ag"
    }]);
});

const server: Server = app.listen(port);

describe("tests", () => {
    it("Simple", async() => {
        const client: RevrestClient<ITagEntity, IBag> = new RevrestClient<ITagEntity, IBag>("http://localhost:3000/api/tags", new DecorateRequest());
        const result = await client.get({
            bag:  { userId: "user34" }
        });

        expect(result.data).to.deep.equal(tagEntitiesArray)
    });

    it("Simple by id", async() => {
        const client: RevrestClient<ITagEntity, IBag> = new RevrestClient<ITagEntity, IBag>("http://localhost:3000/api/tags/{id}", new DecorateRequest());
        const result = await client.get({
            params: { id: 1 },
            bag:  { userId: "user34" }
        });
        expect(result.data).to.deep.equal(tagEntitiesArray.filter(x=> x.id ===  1))
    });

    it("Simple With forigen keys", async() => {
        const client: RevrestClient<ITagEntity, IBag> = new RevrestClient<ITagEntity, IBag>("http://localhost:3000/api/tags", new DecorateRequest());
        client.addMapper({
            entityAttribute: "userId",
            restAPIAttribute: "id",
            restAPIURL: "http://localhost:3000/api/users",
            mergeEntities: (entity: ITagEntity, possibleValue: IUserEntity) => {
                if(possibleValue) {
                    entity.email = possibleValue.email;
                    return entity;
                }
            }
        });
        const result = await client.get({
            bag:  { userId: "context1" }
        });

        expect(result.data).to.deep.equal([{
            id: 1,
            userId: 3,
            email: "user3@taranis.ag"
        },
        {
            id: 2,
            userId: 4,
            email: "user4@taranis.ag"
        }]);
    });

    it("simple post", async() => {
        const client: RevrestClient<ITagEntity, IBag> = new RevrestClient<ITagEntity, IBag>("http://localhost:3000/api/tags/{id}", new DecorateRequest());
        const result = await client.post({
            bag:  { userId: "user34" },
            data: {
                userId: 3
            }
        });
    });

    it("get error - 404", async() => {
        try {
            const client: RevrestClient<ITagEntity, IBag> = new RevrestClient<ITagEntity, IBag>("http://localhost:3000/api/tagsdss/{id}", new DecorateRequest());
            const result = await client.get({
                bag:  { userId: "user34" },
                params: {
                    id: 334343
                }
            });
        } catch (error) {
            expect((error as ReverestError).status).to.equal(404);
        }
       
    });

    after(()=> {
        server.close();
    })
});
