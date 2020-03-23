import { ExegesisContext } from 'exegesis-express';
import { BadRequestError } from '../helpers/errors';
import { toObjectId } from '../helpers/utils';
import { initializeModels } from '../models';
import { ApiMessage, ApiMessageCreate } from '../models/message';
import MessageService from '../services/messageService';
import { PaginatedResult } from '../services/types';

function getService() {
    const db = initializeModels();
    return new MessageService(db, Date);
}

function getBodyAsMessageCreate(body: unknown): ApiMessageCreate {
    const content = (body as any).content;
    /* istanbul ignore next */
    if (content === undefined || typeof content !== 'string') {
        throw new BadRequestError('No message content string provided.');
    }
    return {
        content: content as string,
    };
}

export async function getMessages(context: ExegesisContext): Promise<PaginatedResult<ApiMessage>> {
    const service = getService();
    const { afterId, limit } = context.params.query;

    const result = await service.retrieve({ afterId, limit });
    return {
        ...result,
        items: result.items.map(MessageService.remapOut),
    };
}

export async function getMessage(context: ExegesisContext): Promise<ApiMessage> {
    const service = getService();
    const { id } = context.params.path;
    if (!id) {
        throw new BadRequestError('No id provided');
    }
    const message = await service.retrieveOne(toObjectId(id));
    return MessageService.remapOut(message);
}

export async function createMessage(context: ExegesisContext): Promise<ApiMessage> {
    const service = getService();
    const body = getBodyAsMessageCreate(context.requestBody);
    const messageCreate = service.remapInForCreate(body);
    const message = await service.create(messageCreate);
    return MessageService.remapOut(message);
}

export async function updateMessage(context: ExegesisContext): Promise<ApiMessage> {
    const service = getService();
    const { id } = context.params.path;
    if (!id) {
        throw new BadRequestError('No id provided');
    }
    const body = getBodyAsMessageCreate(context.requestBody);
    const messageUpdate = service.remapInForCreate(body);
    const message = await service.update(id, messageUpdate);
    return MessageService.remapOut(message);
}

export async function deleteMessage(context: ExegesisContext): Promise<void> {
    const service = getService();
    const { id } = context.params.path;
    if (!id) {
        throw new BadRequestError('No id provided');
    }
    await service.delete(id);
    context.res.setStatus(204).end();
}
