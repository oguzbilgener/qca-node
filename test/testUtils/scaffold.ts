import path from 'path';
import { promises as fs } from 'fs';
import { ObjectId, Db } from 'mongodb';
import { shuffle } from 'lodash';
import { Message } from '../../src/models/message';

async function loadText() {
    try {
        return (await fs.readFile(path.resolve(__dirname, './lipsum.txt'))).toString();
    } catch (err) {
        throw new Error('Could not read lipsum.txt');
    }
}

function prepareData(input: string) {
    return input.replace(/\\n/g, '').split('. ');
}

export async function getShuffledMessages() {
    return shuffle(prepareData(await loadText()));
}

export default async function scaffoldDb(db: Db) {
    const collection = db.collection('messages');
    const now = Date.now();

    const messages: Message[] = (await getShuffledMessages()).map((content, i) => ({
        _id: new ObjectId(),
        content,
        createdAt: new Date(now - i * 60 * 1000),
        deleted: false,
    }));

    await collection.insertMany(messages);
    return messages.length;
}
