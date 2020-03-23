import { ObjectId } from 'mongodb';
import { toObjectId, findLastId } from '../../src/helpers/utils';

describe('utils', () => {
    describe('toObjectId', () => {
        it('should parse a valid string object id', () => {
            const id = '5e77f33eed51462745cdb756';
            expect(toObjectId(id).toString()).toEqual(id);
        });

        it('should return an ObjectId object directly', () => {
            const oid = new ObjectId();
            expect(toObjectId(oid)).toBe(oid);
        });

        it('should throw if an invalid string is given', () => {
            expect(() => toObjectId('boo')).toThrow();
        });
    });

    describe('findLastId', () => {
        it('should return undefined for an empty array', () => {
            expect(findLastId([])).toBeUndefined();
        });

        it('should find the last item id', () => {
            const items = [
                { _id: new ObjectId() },
                { _id: new ObjectId() },
                { _id: new ObjectId() },
                { _id: new ObjectId() },
            ];
            expect(findLastId(items)).toEqual(items[3]._id.toString());
        });
    });
});
