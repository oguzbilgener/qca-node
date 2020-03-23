import { ConnectionOptions } from 'mongoose';
import { LogLevel } from '../helpers/log';

export type Env = 'development' | 'test' | 'production';

export interface Config {
    env: Env;
    port: number;
    logLevel: LogLevel;
    db: {
        connectionUri: string;
        connectionOptions: ConnectionOptions;
    };
}
