import { ObjectId } from 'mongodb';
import { BadRequestError, NotFoundError } from '../../src/helpers/errors';
import { EnhancedMessage, Message } from '../../src/models/message';
import MessageService from '../../src/services/messageService';

describe('MessageService', () => {
    describe('create', () => {
        it('should now allow creation of messages with empty content', async () => {
            const fakeMsg = {
                _id: new ObjectId(),
                content: 'Hello, world!!',
                createdAt: new Date(),
            };
            const fakeDb = {
                Message: {
                    findOne: () => Promise.resolve(fakeMsg),
                },
            };
            const service = new MessageService(fakeDb as any, Date);
            await expect(
                service.create({
                    content: '',
                    createdAt: new Date(),
                })
            ).rejects.toThrowError(BadRequestError);
        });

        it('should create a message', async () => {
            const fakeMessageDoc = {
                save: () => Promise.resolve(),
            };
            const fakeMessageCons = function(m: Message) {
                return fakeMessageDoc;
            };
            const spy = jest.spyOn(fakeMessageDoc, 'save');
            const fakeDb = {
                Message: fakeMessageCons,
            } as any;
            const service = new MessageService(fakeDb, Date);
            await service.create({
                content: 'Hello, world!',
                createdAt: new Date(),
            });
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('retrieve', () => {
        it('should paginate results', async () => {
            const fakeMsg = {
                _id: new ObjectId(),
                content: 'Hello, world!!',
                createdAt: new Date(),
            };
            class FakeQuery {
                async count() {
                    return 51;
                }
                sort() {
                    return this;
                }
                limit() {
                    return this;
                }
                toArray() {
                    return [fakeMsg];
                }
                then(success: (items: any[]) => void, fail: (err: Error) => void) {
                    return success([fakeMsg]);
                }
            }
            const fakeDb = {
                Message: {
                    collection: { count: () => 51 },
                    find: () => new FakeQuery(),
                },
            };
            const spy = jest.spyOn(fakeDb.Message, 'find');
            const service = new MessageService(fakeDb as any, Date);
            const result = await service.retrieve({
                afterId: new ObjectId().toHexString(),
                limit: 27,
            });
            expect(result.items).toContain(fakeMsg);
            expect(result.hasMore).toEqual(true);
            expect(result.lastId).toBeDefined();
            expect(result.lastId && result.lastId.toString()).toEqual(fakeMsg._id.toHexString());
            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({
                    deleted: false,
                })
            );
            spy.mockRestore();
        });
        it('should get the first page', async () => {
            const fakeMsg = {
                _id: new ObjectId(),
                content: 'Hello, world!!',
                createdAt: new Date(),
            };
            class FakeQuery {
                async count() {
                    return 2;
                }
                sort() {
                    return this;
                }
                limit() {
                    return this;
                }
                toArray() {
                    return [fakeMsg];
                }
                then(success: (items: any[]) => void, fail: (err: Error) => void) {
                    return success([fakeMsg]);
                }
            }
            const fakeDb = {
                Message: {
                    collection: { count: () => 2 },
                    find: () => new FakeQuery(),
                },
            };
            const spy = jest.spyOn(fakeDb.Message, 'find');
            const service = new MessageService(fakeDb as any, Date);
            const result = await service.retrieve({});
            expect(result.items).toContain(fakeMsg);
            expect(result.hasMore).toEqual(false);
            expect(result.lastId).toBeDefined();
            expect(result.lastId && result.lastId.toString()).toEqual(fakeMsg._id.toHexString());
            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({
                    deleted: false,
                })
            );
            spy.mockRestore();
        });
    });

    describe('retrieveOne', () => {
        it('should retrieve a message', async () => {
            const fakeMsg = {
                _id: new ObjectId(),
                content: 'Hello, world!!',
                createdAt: new Date(),
            };
            const fakeDb = {
                Message: {
                    findOne: () => Promise.resolve(fakeMsg),
                },
            };
            const spy = jest.spyOn(fakeDb.Message, 'findOne');
            const service = new MessageService(fakeDb as any, Date);
            const msg = await service.retrieveOne(fakeMsg._id);
            expect(msg._id.toString()).toEqual(fakeMsg._id.toString());
            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: fakeMsg._id,
                    deleted: false,
                })
            );
        });

        it('should throw if message is not found', async () => {
            const fakeDb = {
                Message: {
                    findOne: () => Promise.resolve(undefined),
                },
            };
            const spy = jest.spyOn(fakeDb.Message, 'findOne');
            const service = new MessageService(fakeDb as any, Date);
            const otherObjectId = new ObjectId();
            expect(service.retrieveOne(otherObjectId)).rejects.toThrowError(NotFoundError);
            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: otherObjectId,
                    deleted: false,
                })
            );
        });
    });

    describe('update', () => {
        it('should update a message', async () => {
            const updateMsg = {
                content: 'Overwrite',
                createdAt: new Date(),
            };
            const fakeDb = {
                Message: {
                    updateOne: () => Promise.resolve({ nModified: 1 }),
                    findOne: () => Promise.resolve(updateMsg),
                },
            };
            const spy = jest.spyOn(fakeDb.Message, 'updateOne');
            const service = new MessageService(fakeDb as any, Date);
            const otherObjectId = new ObjectId();
            await expect(service.update(otherObjectId, updateMsg)).resolves;
            await expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: otherObjectId,
                    deleted: false,
                }),
                expect.objectContaining({
                    $set: expect.objectContaining({
                        content: updateMsg.content,
                    }),
                })
            );
        });

        it('should throw if the new message content is empty', async () => {
            const updateMsg = {
                content: '',
                createdAt: new Date(),
            };
            const fakeDb = {
                Message: {
                    updateOne: () => Promise.reject(new NotFoundError('nope')),
                    findOne: () => Promise.resolve(updateMsg),
                },
            };
            const spy = jest.spyOn(fakeDb.Message, 'updateOne');
            const service = new MessageService(fakeDb as any, Date);
            const otherObjectId = new ObjectId();
            await expect(service.update(otherObjectId, updateMsg)).rejects.toThrowError(
                BadRequestError
            );
            await expect(spy).toHaveBeenCalledTimes(0);
        });

        it('should throw if message is not found', async () => {
            const updateMsg = {
                content: 'Overwrite',
                createdAt: new Date(),
            };
            const fakeDb = {
                Message: {
                    updateOne: () => Promise.reject(new NotFoundError('nope')),
                    findOne: () => Promise.resolve(updateMsg),
                },
            };
            const spy = jest.spyOn(fakeDb.Message, 'updateOne');
            const service = new MessageService(fakeDb as any, Date);
            const otherObjectId = new ObjectId();
            await expect(service.update(otherObjectId, updateMsg)).rejects.toThrowError(
                NotFoundError
            );
            await expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: otherObjectId,
                    deleted: false,
                }),
                expect.objectContaining({
                    $set: expect.objectContaining({
                        content: updateMsg.content,
                    }),
                })
            );
        });
    });

    describe('delete', () => {
        it('should delete a message', async () => {
            const fakeDb = {
                Message: {
                    updateOne: () => Promise.resolve({ nModified: 1 }),
                },
            };
            const spy = jest.spyOn(fakeDb.Message, 'updateOne');
            const service = new MessageService(fakeDb as any, Date);
            const otherObjectId = new ObjectId();
            await expect(service.delete(otherObjectId)).resolves;
            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: otherObjectId,
                    deleted: false,
                }),
                expect.objectContaining({
                    $set: expect.objectContaining({
                        deleted: true,
                    }),
                })
            );
        });

        it('should throw if message is not found', async () => {
            const fakeDb = {
                Message: {
                    updateOne: () => Promise.reject(new NotFoundError('nope')),
                },
            };
            const spy = jest.spyOn(fakeDb.Message, 'updateOne');
            const service = new MessageService(fakeDb as any, Date);
            const otherObjectId = new ObjectId();
            await expect(service.delete(otherObjectId)).rejects.toThrowError(NotFoundError);
            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: otherObjectId,
                    deleted: false,
                }),
                expect.objectContaining({
                    $set: expect.objectContaining({
                        deleted: true,
                    }),
                })
            );
        });
    });

    describe('remapInForCreate', () => {
        it('should trim the input', () => {
            const service = new MessageService({} as any, Date);
            expect(
                service.remapInForCreate({
                    content: '  Hello world ',
                })
            ).toEqual(
                expect.objectContaining({
                    content: 'Hello world',
                })
            );
        });

        it('should use the date class', () => {
            class XDate extends Date {
                getTime() {
                    return 42;
                }
            }
            const service = new MessageService({} as any, XDate as typeof Date);
            const mapped = service.remapInForCreate({
                content: 'Hello world',
            });
            expect(mapped.createdAt.getTime()).toEqual(42);
        });
    });

    describe('remapOut', () => {
        it('contains the palindrome result', () => {
            const enhancedMessage: EnhancedMessage = {
                _id: new ObjectId(),
                content: 'racecar',
                createdAt: new Date(),
                isPalindrome() {
                    return true;
                },
            };
            const result = MessageService.remapOut(enhancedMessage);
            expect(result.id).toEqual(enhancedMessage._id.toString());
            expect(result.content).toEqual(enhancedMessage.content);
            expect(result.palindrome).toEqual(true);
        });

        it('contains the update date', () => {
            const enhancedMessage: EnhancedMessage = {
                _id: new ObjectId(),
                content: 'meh',
                createdAt: new Date(),
                updatedAt: new Date(),
                isPalindrome() {
                    return false;
                },
            };
            const result = MessageService.remapOut(enhancedMessage);
            expect(result.id).toEqual(enhancedMessage._id.toString());
            expect(result.content).toEqual(enhancedMessage.content);
            expect(result.palindrome).toEqual(false);
            expect(result.createdAt).toBeDefined();
        });
    });

    describe('getSanitizedQueryParamsWithDefaults', () => {
        it('should not allow negative or zero limits', () => {
            const service = new MessageService({} as any, Date);
            expect(
                service.getSanitizedQueryParamsWithDefaults({
                    limit: -1,
                })
            ).toEqual(
                expect.objectContaining({
                    limit: 25,
                    afterId: undefined,
                })
            );
            expect(
                service.getSanitizedQueryParamsWithDefaults({
                    limit: 0,
                })
            ).toEqual(
                expect.objectContaining({
                    limit: 25,
                    afterId: undefined,
                })
            );
        });

        it('should now allow more than the maximum defined limit', () => {
            const service = new MessageService({} as any, Date);
            expect(
                service.getSanitizedQueryParamsWithDefaults({
                    limit: 9999999,
                })
            ).toEqual(
                expect.objectContaining({
                    limit: 1000,
                    afterId: undefined,
                })
            );
        });

        it('should pass a valid limit and a afterId parameter', () => {
            const id = new ObjectId();
            const service = new MessageService({} as any, Date);
            const result = service.getSanitizedQueryParamsWithDefaults({
                limit: 22,
                afterId: id.toString(),
            });
            expect(result.limit).toEqual(22);
            expect(result.afterId && result.afterId.toString()).toEqual(id.toString());
        });

        it('should use the default limit if there is no limit provided', () => {
            const service = new MessageService({} as any, Date);
            const result = service.getSanitizedQueryParamsWithDefaults({});
            expect(result.limit).toEqual(25);
        });
    });
});
