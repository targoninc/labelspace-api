import {DbEntityList} from "./DbEntityList.ts";

export interface DbOptions {
    disableCacheWrite?: boolean;
    disableCacheRead?: boolean;
    entities?: DbEntityList[];
}