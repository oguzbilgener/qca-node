import { ObjectId } from 'mongodb';
import { BadRequestError, NotFoundError } from '../helpers/errors';
import { formatDate } from '../helpers/formats';
import { findLastId, toObjectId } from '../helpers/utils';
import {
    ApiMessage,
    ApiMessageCreate,
    EnhancedMessage,
    Message,
    MessageDocument,
    SchemaMessage,
} from '../models/message';
import { BaseService, PaginatedResult, RetrieveQuery, SanitizedRetrieveQuery } from './types';

const MAX_RETRIEVE_COUNT = 1000;
const DEFAULT_LIMIT_PER_PAGE = 25;

export default class MessageService extends BaseService<
    Message,
    MessageDocument,
    ApiMessage,
    ApiMessageCreate
> {
    /**
     * Create a new message. Message content must be non-empty.
     * @param message the message details including the create date.
     */
    async create(message: Message): Promise<MessageDocument> {
        if (message.content.length === 0) {
            throw new BadRequestError('Cannot create a message with an empty content.');
        }
        return await new this.db.Message(message).save();
    }
    /**
     * Retrieve a list of messages, paginate them.
     * @param query
     */
    async retrieve(query: RetrieveQuery): Promise<PaginatedResult<EnhancedMessage>> {
        const params = this.getSanitizedQueryParamsWithDefaults(query);

        const findQuery: { [K in keyof SchemaMessage]?: any } = {
            deleted: false,
        };

        if (params.afterId) {
            findQuery['_id'] = {
                $lt: params.afterId,
            };
        }

        const total = await this.db.Message.collection.estimatedDocumentCount(findQuery);
        const hasMore = total > params.limit;
        const messages = await this.db.Message.find(findQuery)
            .sort({ _id: -1 })
            .limit(params.limit);
        return {
            items: messages,
            lastId: findLastId(messages),
            hasMore,
        };
    }
    /**
     * Returns a single message document by the given object ID, if found.
     * @param id the message Id
     * @returns the message document.
     */
    async retrieveOne(id: ObjectId): Promise<MessageDocument> {
        const message = await this.db.Message.findOne(this.getFindQuery(id));
        if (!message) {
            throw new NotFoundError('Message with the specified ID is not found.');
        }
        return message;
    }
    /**
     * Updates the content of a message given by the ID, marks the last update
     * date and returns the message.
     * @param id the message ID
     * @param message the object that contains the new message. The `createdAt`
     * field is ignored.
     * @returns The updated message document
     */
    async update(id: ObjectId, message: Message): Promise<MessageDocument> {
        if (message.content.length === 0) {
            throw new BadRequestError('Cannot update a message with an empty content.');
        }
        const { nModified } = await this.db.Message.updateOne(this.getFindQuery(id), {
            $set: {
                content: message.content,
                updatedAt: new this.DateClass(),
            },
        });
        if (!nModified || nModified !== 1) {
            throw new NotFoundError('Message not found');
        }
        return await this.retrieveOne(id);
    }
    /**
     * Mark a message deleted.
     * This method soft-deletes the document.
     * @param id the message ID.
     */
    async delete(id: ObjectId): Promise<void> {
        const { nModified } = await this.db.Message.updateOne(this.getFindQuery(id), {
            $set: {
                deleted: true,
                updatedAt: new this.DateClass(),
            },
        });
        if (!nModified || nModified !== 1) {
            throw new NotFoundError('Message not found');
        }
    }

    remapInForCreate(data: ApiMessageCreate): Message {
        return {
            content: data.content.trim(),
            createdAt: new this.DateClass(),
        };
    }
    static remapOut(message: EnhancedMessage): ApiMessage {
        return {
            id: message._id.toString(),
            content: message.content,
            createdAt: formatDate(message.createdAt),
            updatedAt: message.updatedAt ? formatDate(message.updatedAt) : undefined,
            palindrome: message.isPalindrome(),
        };
    }

    getFindQuery(id: ObjectId) {
        return {
            _id: id,
            deleted: false,
        };
    }

    /**
     * Get the common query parameters used in retrieving a paginated list of
     * objects, with sane defaults. May throw an error if invalid values are
     * provided, such as an invalid ObjectId.
     * @param query
     */
    getSanitizedQueryParamsWithDefaults(query: RetrieveQuery): SanitizedRetrieveQuery {
        let max: number;
        if (query.limit !== undefined) {
            if (query.limit <= 0) {
                max = DEFAULT_LIMIT_PER_PAGE;
            } else if (query.limit < MAX_RETRIEVE_COUNT) {
                max = Math.ceil(query.limit);
            } else {
                max = MAX_RETRIEVE_COUNT;
            }
        } else {
            max = DEFAULT_LIMIT_PER_PAGE;
        }

        return {
            afterId: query.afterId ? toObjectId(query.afterId) : undefined,
            limit: max,
        };
    }
}
