import { InternalServerError } from '../../src/helpers/errors';
import { getConnectionOrFail } from '../../src/models';

describe('models', () => {
    describe('getConnectionOrFail', () => {
        it('should throw if the Mongoose connection is not ready', () => {
            jest.mock('mongoose', () => ({
                connection: {
                    readyState: 99,
                },
                Schema: function() {},
            }));
            expect(() => getConnectionOrFail()).toThrow(InternalServerError);
            jest.clearAllMocks();
        });
    });
});
