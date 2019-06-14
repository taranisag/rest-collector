/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect } from 'chai';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { RevrestClient, DecorateRequest as IDecorateRequest, ReverestRequest } from '../src/index';
import { Server } from 'http';
import ReverestError from '../src/ReverestError';
const app = express();
// support parsing of application/json type post data
app.use(bodyParser.json());
const port = 3000;

interface BaseEntity {
    id: number;
    userId: number;
    email?: string;
    course?: string;
}

interface LoginsEntity {
    id: number;
    userId: number;
    loginTime: number;
}

interface UserEntity {
    id: number;
    email: string;
}

interface UserCourseEntity {
    user: number;
    course: string;
}

interface Bag {
    userId: string;
}

class DecorateRequest implements IDecorateRequest<Bag> {
    public decorateRequest(req: ReverestRequest, bag: Bag): void {
        req.headers.userId = bag.userId;
    }
}

const loginsEntitiesArray: LoginsEntity[] = [
    {
        id: 1,
        userId: 3,
        loginTime: 1560518174,
    },
    {
        id: 2,
        userId: 4,
        loginTime: 1560172574,
    },
];
app.get('/api/logins/:id(\\d+)', (req: Request, res: Response) => {
    res.send(loginsEntitiesArray.filter(x => x.id === +req.params.id));
});

app.post('/api/logins', (req: Request, res: Response) => {
    var indexOfMaxValue = loginsEntitiesArray.map(x => x.id).reduce((iMax, x, i, arr) => (x > arr[iMax] ? i : iMax), 0);
    const newLogin = {
        ...req.body,
        id: indexOfMaxValue++,
    };
    loginsEntitiesArray.push(newLogin);
    res.send(newLogin);
});

app.get('/api/logins', (req: Request, res: Response) => {
    res.send(loginsEntitiesArray);
});

app.get('/api/users', (req: Request, res: Response) => {
    res.send([
        {
            id: 3,
            email: 'user3@taranis.ag',
        },
        {
            id: 4,
            email: 'user4@taranis.ag',
        },
    ]);
});

app.get('/api/users-courses', (req: Request, res: Response) => {
    res.send([
        {
            user: 3,
            course: 'Chemistry',
        },
        {
            user: 4,
            course: 'Biology',
        },
    ]);
});

app.get('/api/users-courses', (req: Request, res: Response) => {
    res.send([
        {
            user: 3,
            course: 'Chemistry',
        },
        {
            user: 4,
            course: 'Biology',
        },
    ]);
});

const server: Server = app.listen(port);

describe('tests', () => {
    it('Simple', async () => {
        const client: RevrestClient<BaseEntity, Bag> = new RevrestClient<BaseEntity, Bag>(
            'http://localhost:3000/api/logins',
            new DecorateRequest(),
        );
        const result = await client.get({
            bag: { userId: 'user34' },
        });

        expect(result.data).to.deep.equal(loginsEntitiesArray);
    });

    it('Simple by id', async () => {
        const client: RevrestClient<BaseEntity, Bag> = new RevrestClient<BaseEntity, Bag>(
            'http://localhost:3000/api/logins/{id}',
            new DecorateRequest(),
        );
        const result = await client.get({
            params: { id: 1 },
            bag: { userId: 'user34' },
        });
        expect(result.data).to.deep.equal(loginsEntitiesArray.filter(x => x.id === 1));
    });

    it('Simple With forigen keys', async () => {
        const client: RevrestClient<BaseEntity, Bag> = new RevrestClient<BaseEntity, Bag>(
            'http://localhost:3000/api/logins',
            new DecorateRequest(),
        );
        client.addMapper({
            entityAttribute: 'userId',
            restAPIAttribute: 'id',
            restAPIURL: 'http://localhost:3000/api/users',
            mergeEntities: (entity: BaseEntity, possibleValue: UserEntity) => {
                if (possibleValue) {
                    entity.email = possibleValue.email;
                    return entity;
                }
            },
        });
        const result = await client.get({
            bag: { userId: 'context1' },
        });

        expect(result.data).to.deep.equal([
            {
                id: 1,
                userId: 3,
                email: 'user3@taranis.ag',
                loginTime: 1560518174,
            },
            {
                id: 2,
                userId: 4,
                email: 'user4@taranis.ag',
                loginTime: 1560172574,
            },
        ]);
    });

    it('Multiple mappers', async () => {
        const client: RevrestClient<BaseEntity, Bag> = new RevrestClient<BaseEntity, Bag>(
            'http://localhost:3000/api/logins',
            new DecorateRequest(),
        );
        client.addMapper({
            entityAttribute: 'userId',
            restAPIAttribute: 'id',
            restAPIURL: 'http://localhost:3000/api/users',
            mergeEntities: (entity: BaseEntity, possibleValue: UserEntity) => {
                if (possibleValue) {
                    entity.email = possibleValue.email;
                    return entity;
                }
            },
        });
        client.addMapper({
            entityAttribute: 'userId',
            restAPIAttribute: 'user',
            restAPIURL: 'http://localhost:3000/api/users-courses',
            mergeEntities: (entity: BaseEntity, possibleValue: UserCourseEntity) => {
                if (possibleValue) {
                    entity.course = possibleValue.course;
                    return entity;
                }
            },
        });
        const result = await client.get({
            bag: { userId: 'context1' },
        });

        expect(result.data).to.deep.equal([
            {
                id: 1,
                userId: 3,
                email: 'user3@taranis.ag',
                course: 'Chemistry',
                loginTime: 1560518174,
            },
            {
                id: 2,
                userId: 4,
                email: 'user4@taranis.ag',
                course: 'Biology',
                loginTime: 1560172574,
            },
        ]);
    });

    it('simple post', async () => {
        const client: RevrestClient<BaseEntity, Bag> = new RevrestClient<BaseEntity, Bag>(
            'http://localhost:3000/api/logins/{id}',
            new DecorateRequest(),
        );
        await client.post({
            bag: { userId: 'user34' },
            data: {
                userId: 3,
            },
        });
    });

    it('get error - 404', async () => {
        try {
            const client: RevrestClient<BaseEntity, Bag> = new RevrestClient<BaseEntity, Bag>(
                'http://localhost:3000/api/logins/{id}',
                new DecorateRequest(),
            );
            await client.get({
                bag: { userId: 'user34' },
                params: {
                    id: 334343,
                },
            });
        } catch (error) {
            expect((error as ReverestError).status).to.equal(404);
        }
    });

    after(() => {
        server.close();
    });
});
