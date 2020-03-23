import { DB, LeanItem } from '../models/types';
import { ObjectId } from 'mongodb';

export interface RetrieveQuery {
    afterId?: string;
    limit?: number;
}

export interface SanitizedRetrieveQuery {
    afterId?: ObjectId;
    limit: number;
}

export interface PaginatedResult<T> {
    items: T[];
    lastId?: string;
    hasMore: boolean;
}

export interface Service<ModelType, DocumentType, ApiType, ApiCreateType> {
    create(data: ModelType): Promise<DocumentType>;
    retrieve(query: RetrieveQuery): Promise<PaginatedResult<LeanItem<ModelType>>>;
    retrieveOne(id: string | ObjectId): Promise<DocumentType>;
    update(id: string | ObjectId, data: ApiCreateType): Promise<DocumentType>;
    delete(id: string | ObjectId): Promise<void>;

    remapInForCreate(data: ApiCreateType): ModelType;
    remapOut(message: LeanItem<ModelType>): ApiType;
}

export abstract class BaseService<ModelType, DocumentType, ApiType, ApiCreateType> {
    protected db: DB;
    protected DateClass: typeof Date;

    constructor(db: DB, dateClass: typeof Date) {
        this.db = db;
        this.DateClass = dateClass;
    }
}
