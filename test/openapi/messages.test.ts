import { Express } from 'express';
import { Db, MongoClient, ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import request from 'supertest';
import { makeApp } from '../index.test';
import scaffold from '../testUtils/scaffold';

describe('/v1/messages', () => {
    let connection: MongoClient;
    let conn: Db;
    let app: Express;

    beforeAll(async () => {
        jest.setTimeout(60 * 1000);
        const testMongoUrl = process.env.MONGO_URL;
        if (!testMongoUrl) {
            throw new Error('No MONGO_URL env parameter');
        }
        connection = await MongoClient.connect(testMongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        conn = await connection.db();
        await scaffold(conn);
        app = await makeApp();
    });

    afterAll(async () => {
        await connection.close();
        await mongoose.disconnect();
    });

    describe('GET /v1/messages', () => {
        it('should get messages on the first page', async () => {
            const response = await request(app)
                .get('/v1/messages')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/);
            expect(response.status).toEqual(200);
            expect(response.body.items).toBeDefined();
            expect(response.body.items).toHaveLength(25);
            expect(response.body.hasMore).toEqual(true);
        });

        it('should get five messages from the second page', async () => {
            const page1Response = await request(app)
                .get('/v1/messages')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/);
            expect(page1Response.body.lastId).toBeDefined();
            const response = await request(app)
                .get(`/v1/messages?limit=5&afterId=${page1Response.body.lastId}`)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/);

            expect(response.status).toEqual(200);
            expect(response.body.items).toBeDefined();
            expect(response.body.items).toHaveLength(5);
            expect(response.body.hasMore).toEqual(true);
        });

        it('should not allow a limit parameter greater than 1000', async () => {
            const response = await request(app)
                .get('/v1/messages?limit=9999999')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/);
            expect(response.status).toEqual(400);
        });

        it('should not allow a limit parameter smaller than 1', async () => {
            const response = await request(app)
                .get('/v1/messages?limit=0')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/);
            expect(response.status).toEqual(400);
        });
    });

    describe('GET /v1/messages', () => {
        it('should return 404 for a nonexistent message', async () => {
            const response = await request(app)
                .get(`/v1/messages/${new ObjectId().toString()}`)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/);
            expect(response.status).toEqual(404);
        });

        it('should return 400 when no id is provided', async () => {
            const response = await request(app)
                .get(`/v1/messages/`)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/);
            expect(response.status).toEqual(400);
        });

        it('should return a particular message', async () => {
            const firstResponse = await request(app)
                .get('/v1/messages?limit=1')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/);
            expect(firstResponse.body.items.length).toEqual(1);
            const id = firstResponse.body.items[0].id;

            const response = await request(app)
                .get(`/v1/messages/${id}`)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/);
            expect(response.status).toEqual(200);
            expect(response.body.id).toEqual(id);
            expect(firstResponse.body.items[0]).toEqual(response.body);
        });
    });

    describe('POST /v1/messages', () => {
        it('should create a new message', async () => {
            const content = 'abba';
            const firstResponse = await request(app)
                .post('/v1/messages')
                .set('Accept', 'application/json')
                .send({ content })
                .expect('Content-Type', /json/);
            expect(firstResponse.status).toEqual(200);
            expect(firstResponse.body.content).toEqual(content);
            expect(firstResponse.body.palindrome).toEqual(true);
            expect(firstResponse.body.createdAt).toBeDefined();
            expect(firstResponse.body.id).toBeDefined();
            const id = firstResponse.body.id;

            const response = await request(app)
                .get(`/v1/messages/${id}`)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/);
            expect(response.status).toEqual(200);
            expect(response.body.id).toEqual(id);
            expect(firstResponse.body).toEqual(response.body);
        });

        it('should return 400 when no body is provided', async () => {
            const firstResponse = await request(app)
                .post('/v1/messages')
                .set('Accept', 'application/json')
                .send()
                .expect('Content-Type', /json/);
            expect(firstResponse.status).toEqual(400);
        });
    });

    describe('PUT /v1/messages', () => {
        it('should update a message that is recently created', async () => {
            const content = 'abba';
            const newContent = 'the update!';
            const firstResponse = await request(app)
                .post('/v1/messages')
                .set('Accept', 'application/json')
                .send({ content })
                .expect('Content-Type', /json/);
            expect(firstResponse.status).toEqual(200);
            expect(firstResponse.body.content).toEqual(content);
            expect(firstResponse.body.palindrome).toEqual(true);
            const id = firstResponse.body.id;

            const response = await request(app)
                .put(`/v1/messages/${id}`)
                .set('Accept', 'application/json')
                .send({ content: newContent })
                .expect('Content-Type', /json/);
            expect(response.status).toEqual(200);
            expect(response.body.id).toEqual(id);
            expect(response.body.updatedAt).toBeDefined();
            expect(response.body.content).toEqual(newContent);
            expect(response.body.palindrome).toEqual(false);
        });

        it('should return 400 when no body is provided', async () => {
            const firstResponse = await request(app)
                .put(`/v1/messages/${new ObjectId().toHexString()}`)
                .set('Accept', 'application/json')
                .send()
                .expect('Content-Type', /json/);
            expect(firstResponse.status).toEqual(400);
        });

        it('should return 404 if the message does not exist', async () => {
            const content = 'qwerty';
            const firstResponse = await request(app)
                .put(`/v1/messages/${new ObjectId().toHexString()}`)
                .set('Accept', 'application/json')
                .send({ content })
                .expect('Content-Type', /json/);
            expect(firstResponse.status).toEqual(404);
        });
    });

    describe('DELETE /v1/messages', () => {
        it('should delete a message that is recently created', async () => {
            const content = 'to be deleted';
            const firstResponse = await request(app)
                .post('/v1/messages')
                .set('Accept', 'application/json')
                .send({ content })
                .expect('Content-Type', /json/);
            expect(firstResponse.status).toEqual(200);
            expect(firstResponse.body.content).toEqual(content);
            expect(firstResponse.body.palindrome).toEqual(false);
            const id = firstResponse.body.id;

            const response = await request(app)
                .delete(`/v1/messages/${id}`)
                .set('Accept', 'application/json')
                .send();
            expect(response.status).toEqual(204);
        });

        it('should return 404 if the message does not exist', async () => {
            const response = await request(app)
                .delete(`/v1/messages/${new ObjectId().toHexString()}`)
                .set('Accept', 'application/json')
                .send();
            expect(response.status).toEqual(404);
        });
    });
});
