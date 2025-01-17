import {TriDB} from "../DB/TriDB.js";

export interface SearchTableConfiguration<T> {
    tableName: string;
    type: string;
    searchableFields: Array<keyof T>;
    noAuthCondition?: string;
    urlPrefix: string;
    urlIdField: keyof T;
    hasImageField: keyof T;
    displayField: keyof T;
    subtitleFunction: (t: T) => string;
    enrichAfterSearchFunction?: (db: TriDB, t: T[]) => Promise<T[]>;
}