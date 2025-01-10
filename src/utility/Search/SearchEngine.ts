import {TriDB} from "../DB/TriDB.js";
import {SearchTableConfiguration} from "./SearchTableConfiguration.js";
import {SearchResult} from "./SearchResult.js";
import {SearchRequest} from "../../models/interfaces/SearchRequest.js";
import {SearchMode} from "./SearchMode.js";
import {Entity} from "../../models/interfaces/Entity.js";

export class SearchEngine {
    static async search<T extends Entity>(db: TriDB, searchConfiguration: SearchTableConfiguration<T>, request: SearchRequest): Promise<SearchResult[]> {
        let exactResults: T[];

        exactResults = await db.searchGeneric<T>(searchConfiguration, request, SearchMode.exact);
        let partialResults: T[] = [];
        if (exactResults.length < request.limit) {
            partialResults = await db.searchGeneric<T>(searchConfiguration, request, SearchMode.partial);
            partialResults = partialResults.filter(u => !exactResults.some(e => e.id === u.id));
        }

        if (searchConfiguration.enrichAfterSearchFunction) {
            exactResults = await searchConfiguration.enrichAfterSearchFunction!(db, exactResults);
            partialResults = await searchConfiguration.enrichAfterSearchFunction!(db, partialResults);
        }

        const searchResults: SearchResult[] = exactResults.map(t => {
            return {
                id: t.id,
                url: `${searchConfiguration.urlPrefix}/${t[searchConfiguration.urlIdField]}`,
                exactMatch: true,
                type: searchConfiguration.type,
                hasImage: t[searchConfiguration.hasImageField] as boolean,
                display: t[searchConfiguration.displayField] as string,
                subtitle: searchConfiguration.subtitleFunction(t)
            }
        });
        searchResults.push(...partialResults.map(u => {
            return {
                id: u.id,
                url: `${searchConfiguration.urlPrefix}/${u[searchConfiguration.urlIdField]}`,
                exactMatch: false,
                type: searchConfiguration.type,
                hasImage: u[searchConfiguration.hasImageField] as boolean,
                display: u[searchConfiguration.displayField] as string,
                subtitle: searchConfiguration.subtitleFunction(u)
            }
        }));

        return searchResults;
    }
}