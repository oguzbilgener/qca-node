import dotenv from 'dotenv';
import { Config, Env } from './types';
import { LEVELS, LogLevel } from '../helpers/log';

const VALID_ENVS: Env[] = ['development', 'production', 'test'];
function getNodeEnv(): Env {
    const env = process.env.NODE_ENV;
    if (!env || (VALID_ENVS as string[]).indexOf(env) === -1) {
        return 'production';
    }
    return env as Env;
}

export default function loadConfig(): Config {
    if (!process.env.HTTP_PORT) {
        // Assuming we're running this locally, not in a container.
        // Try loading the environment variables from the `.env` file directly.
        dotenv.config();
    }
    const port = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT, 10) : undefined;
    const logLevel =
        process.env.LOG_LEVEL && Object.keys(LEVELS).indexOf(process.env.LOG_LEVEL)
            ? (process.env.LOG_LEVEL as LogLevel)
            : undefined;
    return {
        env: getNodeEnv() || 'production',
        port: port && isFinite(port) ? port : 8080,
        logLevel: logLevel || 'info',
        db: {
            connectionUri:
                process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/dev',
            connectionOptions: {},
        },
    } as const;
}
