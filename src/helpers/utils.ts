import { ObjectId } from 'mongodb';
import { BadRequestError } from './errors';
import { LeanItem } from '../models/types';
import { isValidObjectId } from './formats';

export function toObjectId(id: string | ObjectId): ObjectId {
    if (typeof id === 'string' && isValidObjectId(id)) {
        return new ObjectId(id);
    } else if (id && id instanceof ObjectId) {
        return id as ObjectId;
    }
    throw new BadRequestError(`Invalid ObjectId: ${id}.`);
}

/**
 * Get the ID of the last item in the list of items, in string format.
 * This assumes the items are sorted in the descending order by the ID.
 * @param items
 */
export function findLastId<T>(items: LeanItem<T>[]): string | undefined {
    if (!items.length) {
        return undefined;
    }
    return items[items.length - 1]._id.toString();
}
