import {
    getCodeFromError,
    BadRequestError,
    NotFoundError,
    InternalServerError,
} from '../../src/helpers/errors';

describe('errors', () => {
    describe('getCodeFromError', () => {
        it('should return the code field if available', () => {
            expect(getCodeFromError({ code: 343 } as any)).toEqual(343);
        });
        it('should return the status field if available', () => {
            expect(getCodeFromError({ status: 613, errors: [] } as any)).toEqual(613);
        });
        it('should return 500 for regular errors', () => {
            expect(getCodeFromError(new Error())).toEqual(500);
        });
    });

    describe('BadRequestError', () => {
        it('has the default error message "Bad Request"', () => {
            expect(new BadRequestError().message).toEqual('Bad Request');
        });
    });
    describe('NotFoundError', () => {
        it('has the default error message "Not Found"', () => {
            expect(new NotFoundError().message).toEqual('Not Found');
        });
    });
    describe('InternalServerError', () => {
        it('has the default error message "Server Error"', () => {
            expect(new InternalServerError().message).toEqual('Server Error');
        });
    });
});
