import express from 'express';
import morgan from 'morgan';
import chalk from 'chalk';
import { Config } from '../config/types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';
export type LogData = { [k: string]: string };

export type LogFn = (level: LogLevel, message: string, data?: LogData) => void;

let currentLevel: number = 2;

export function setLevel(levelLabel: LogLevel) {
    currentLevel = LEVELS[levelLabel];
}

export const LEVELS = {
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    none: 5,
};

export const COLORS = {
    debug: 'gray',
    info: 'cyan',
    warn: 'yellow',
    error: 'red',
    none: 'white',
};

export function log(level: LogLevel, message: string, data?: LogData) {
    if (currentLevel > LEVELS[level]) {
        return;
    }
    console.log(
        chalk.bold(chalk.keyword(COLORS[level])(level.toUpperCase())) + ':',
        message,
        data || ''
    );
}

export default {
    info: log.bind(undefined, 'info'),
    debug: log.bind(undefined, 'debug'),
    warn: log.bind(undefined, 'warn'),
    error: log.bind(undefined, 'error'),
};

export function getFirstElOrUndefined(input: string | string[] | undefined): string | undefined {
    if (!input) {
        return undefined;
    }
    if (input && Array.isArray(input)) {
        return input.length > 0 ? input[0] : undefined;
    }
    return input;
}

export function requestLoggingMiddleware(config: Config): express.RequestHandler {
    morgan.token('remote-addr', req => {
        return (
            getFirstElOrUndefined(req.headers['x-real-ip']) ||
            getFirstElOrUndefined(req.headers['x-forwarded-for']) ||
            req.connection.remoteAddress
        );
    });

    if (config.env === 'test') {
        /* istanbul ignore next */
        return (_req, _res, next) => {
            next();
        };
    }

    return morgan(
        ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" ' +
            ':status :res[content-length] ":referrer" ":user-agent" :response-time ms',
        {
            skip: req => {
                return req.headers['user-agent'] === 'ELB-HealthChecker/2.0';
            },
        }
    );
}
