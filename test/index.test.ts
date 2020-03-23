import { Express } from 'express';
import request from 'supertest';
import loadConfig from '../src/config';
import { createServer } from '../src/index';

export async function makeApp() {
    if (!process.env.MONGO_URL) {
        fail('No MONGO_URL env parameter in messages openapi test');
    }
    return await createServer({
        ...loadConfig(),
        logLevel: 'none',
        db: {
            connectionUri: process.env.MONGO_URL,
            connectionOptions: {},
        },
    });
}

describe('index', () => {
    let app: Express;

    beforeAll(async () => {
        app = await makeApp();
    });

    describe('liveness probe', () => {
        it('should return ok', () => {
            request(app)
                .get('/status')
                .expect(200);
        });
    });
});
