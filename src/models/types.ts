import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { MessageDocument } from './message';

export type LeanItem<T> = T & {
    _id: ObjectId;
};

export interface DB {
    Message: Model<MessageDocument>;
}
