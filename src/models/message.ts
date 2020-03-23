import { Schema, Document } from 'mongoose';
import { LeanItem } from './types';
import { isPalindrome } from '../helpers/messages';

/**
 * The base message object for the server-side.
 */
export interface Message {
    content: string;
    createdAt: Date;
    updatedAt?: Date;
}

/**
 * The corresponding JSON-safe type for the `MessageCreate` OpenApi schema.
 * Per the guidelines, we're not allowed to use any code generators so that's
 * why these types are here.
 */
export interface ApiMessageCreate {
    content: string;
}

/**
 * The corresponding JSON-safe type for the `Message` OpenApi schema.
 */
export interface ApiMessage extends ApiMessageCreate {
    id: string;
    createdAt: string;
    updatedAt?: string;
    palindrome: boolean;
}

/**
 * What you get when you call `.lean()` on a mongoose query.
 */
export type LeanMessage = LeanItem<Message>;

export interface EnhancedMessage extends LeanMessage {
    isPalindrome(): boolean;
}

export type MessageDocument = EnhancedMessage & Document;

export type SchemaMessage = EnhancedMessage & {
    deleted: boolean;
};

const MessageSchema = new Schema<SchemaMessage>({
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    // Soft delete flag
    deleted: { type: Boolean, default: false },
});

// Add the `isPalindrome` method to the EnhancedMessage model.
MessageSchema.methods.isPalindrome = function() {
    return isPalindrome(this);
};

export { MessageSchema as Schema };
