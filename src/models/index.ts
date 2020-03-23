import mongoose, { Mongoose } from 'mongoose';
import { retry } from 'promise-tools';
import { Config } from '../config/types';
import { InternalServerError } from '../helpers/errors';
import log from '../helpers/log';
import { Schema as MessageSchema } from './message';
import { DB } from './types';

export function getConnectionOrFail() {
    const connection = mongoose.connection;
    if (connection.readyState !== 1 /*ConnectionStates.connected*/) {
        throw new InternalServerError('Not connected to the database at the moment');
    }
    return connection;
}

export function connect(dbConfig: Config['db']): Promise<Mongoose> {
    return retry({ times: 60, interval: 1000 }, async () => {
        try {
            return await mongoose.connect(dbConfig.connectionUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                poolSize: 10,
            });
        } catch (err) {
            /* istanbul ignore next */
            log.error('Error: Failed to connect to Mongo. retrying...', err);
            /* istanbul ignore next */
            throw err;
        }
    })
        .then((mongoose: Mongoose) => {
            log.info('Connected to Mongo.');
            return mongoose;
        })
        .catch(err => {
            /* istanbul ignore next */
            log.error('Error: Failed to connect to Mongo after many attempts');
            /* istanbul ignore next */
            process.exit(1);
        });
}

/**
 * Initialize the Mongoose models and return a DB object.
 * @throws {InternalServerError} if not connected to the database currently.
 */
export function initializeModels(): DB {
    const connection = getConnectionOrFail();

    return {
        Message: connection.model('messages', MessageSchema),
    };
}
