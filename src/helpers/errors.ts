import { ValidationError } from 'express-openapi-validator/dist/framework/types';

export { ValidationError };

export interface ServerError extends Error {
    code: number;
}

export function isServerError(error: Error | ValidationError): error is ServerError {
    return !!(error as any).code;
}

export function isValidationError(error: object): error is ValidationError {
    const err = error as any;
    return 'errors' in err && Array.isArray(err.errors) && !!err.status;
}

export class BadRequestError extends Error implements ServerError {
    code = 400;
    constructor(message = 'Bad Request') {
        super(message);
    }
}

export class NotFoundError extends Error implements ServerError {
    code = 404;
    constructor(message = 'Not Found') {
        super(message);
    }
}

export class InternalServerError extends Error implements ServerError {
    code = 500;
    constructor(message = 'Server Error') {
        super(message);
    }
}

export function getCodeFromError(error: Error | ValidationError): number {
    if (isServerError(error)) {
        return error.code;
    }
    if (isValidationError(error)) {
        return error.status;
    }
    return 500;
}
