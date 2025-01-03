import {MariaDB} from "./MariaDB.js";

export class DatabaseEntityCollector {
    static async collectEntity(db: MariaDB, table: string, id: number): Promise<any> {
        // Get the main entity
        const entity = await db.query(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [id]);
        if (!entity[0]) {
            throw new Error(`Entity with id ${id} not found in table ${table}`);
        }
        // Retrieve related entities (foreign key children)
        const relatedEntities = await this.getRelatedEntities(db, table, id);
        // Merge related entities into the main entity
        return { ...entity[0], ...relatedEntities };
    }

    private static async getRelatedEntities(db: MariaDB, table: string, id: number): Promise<any> {
        const related = {};
        const foreignKeyTables = await this.getTablesWithForeignKeyToTable(db, table);
        for (const foreignKeyTable of foreignKeyTables) {
            related[foreignKeyTable.name] = await db.query(`SELECT * FROM ${foreignKeyTable.name} WHERE ${foreignKeyTable.keyedColumn} = ?`, [id]);
        }
        return related;
    }

    static async getTablesWithForeignKeyToTable(
        db: MariaDB,
        table: string
    ): Promise<Array<{ name: string; keyedColumn: string }>> {

        const query = `
            SELECT 
                TABLE_NAME AS name,
                COLUMN_NAME AS keyedColumn
            FROM 
                information_schema.KEY_COLUMN_USAGE
            WHERE 
                REFERENCED_TABLE_NAME = ?
                AND REFERENCED_COLUMN_NAME IS NOT NULL;
        `;

        try {
            const results = await db.query(query, [table]);
            return results.map((row: any) => ({
                name: row.name,
                keyedColumn: row.keyedColumn,
            }));
        } catch (error) {
            console.error('Error fetching foreign key information:', error);
            throw new Error('Could not fetch foreign key information from the database.');
        }
    }
}
