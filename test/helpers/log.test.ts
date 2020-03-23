import log, { getFirstElOrUndefined, requestLoggingMiddleware } from '../../src/helpers/log';

describe('log', () => {
    describe('log', () => {
        it('should not log if the current level is higher than the given level', () => {
            const spy = jest.spyOn(console, 'log').mockImplementation();
            log.debug('hello');
            expect(spy).toHaveBeenCalledTimes(0);
            spy.mockRestore();
        });
        it('should log if the current level is the same as the given level', () => {
            const spy = jest.spyOn(console, 'log').mockImplementation();
            log.info('hello');
            expect(spy).toHaveBeenCalledTimes(1);
            spy.mockRestore();
        });
        it('should log if the current level is lower than the given level', () => {
            const spy = jest.spyOn(console, 'log').mockImplementation();
            log.warn('hello');
            log.error('hello');
            expect(spy).toHaveBeenCalledTimes(2);
            spy.mockRestore();
        });
    });

    describe('getFirstElOrUndefined', () => {
        it('should return undefined for undefined', () => {
            expect(getFirstElOrUndefined(undefined)).toBeUndefined();
        });

        it('should return a string directly', () => {
            const str = 'foo';
            expect(getFirstElOrUndefined(str)).toBe(str);
        });

        it('should return the first element of a string array', () => {
            const strs = ['foo', 'bar', 'baz'];
            expect(getFirstElOrUndefined(strs)).toBe(strs[0]);
        });

        it('should return undefined for empty array', () => {
            expect(getFirstElOrUndefined([])).toBeUndefined();
        });
    });

    describe('requestLoggingMiddleware', () => {});
});
