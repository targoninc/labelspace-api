import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { CLI } from "@targoninc/ts-logging";
import { MariaDB } from "../MariaDB.js";

/**
 * Handles database migrations to ensure the database schema is consistent across all environments.
 *
 * ### How it works
 * 1. The `MigrationManager` is initialized when the application starts.
 * 2. It checks the `tri.migrations` table to see which migrations have already been executed.
 * 3. It looks for `.sql` files in the `scripts` directory.
 * 4. Any new migration files (those not in the `migrations` table) are executed in alphabetical order.
 * 5. Successful migrations are recorded in the `migrations` table.
 */
export class MigrationManager {
    private readonly db: MariaDB;
    private readonly migrationsPath: string;

    constructor(db: MariaDB) {
        this.db = db;

        // Define path to migrations scripts
        this.migrationsPath = join(process.cwd(), 'labelspace-api/src/utility/DB/Migrations/scripts');

        // Check if path exists, fallback to relative if needed (depending on where the app is started)
        if (!existsSync(this.migrationsPath)) {
            const alternativePath = join(process.cwd(), 'src/utility/DB/Migrations/scripts');
            if (existsSync(alternativePath)) {
                this.migrationsPath = alternativePath;
            }
        }
    }

    async runMigrations() {
        CLI.info("Checking for database migrations...");
        await this.ensureMigrationsTable();

        const migrationFiles = await this.getMigrationFiles();
        const executedMigrations = await this.getExecutedMigrations();

        for (const file of migrationFiles) {
            if (!executedMigrations.includes(file)) {
                await this.executeMigration(file);
            }
        }
        CLI.success("Database migrations completed.");
    }

    private async ensureMigrationsTable() {
        try {
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS tri.migrations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch (e) {
            CLI.error(`Failed to create migrations table: ${e}`);
            throw e;
        }
    }

    private async getMigrationFiles(): Promise<string[]> {
        if (!existsSync(this.migrationsPath)) {
            CLI.warning(`Migrations directory not found at ${this.migrationsPath}`);
            return [];
        }
        const files = await readdir(this.migrationsPath);
        return files.filter(file => file.endsWith('.sql')).sort();
    }

    private async getExecutedMigrations(): Promise<string[]> {
        const rows: any[] = await this.db.query('SELECT name FROM tri.migrations');
        return rows.map(row => row.name);
    }

    private async executeMigration(fileName: string) {
        CLI.info(`Executing migration: ${fileName}`);
        const filePath = join(this.migrationsPath, fileName);
        const sql = await readFile(filePath, 'utf8');

        // Split by semicolon
        const statements = sql.split(';').filter(s => s.trim().length > 0);

        for (const statement of statements) {
            try {
                await this.db.query(statement);
            } catch (e: any) {
                CLI.error(`Error in migration ${fileName} at statement: ${statement.substring(0, 100)}...`);
                CLI.error(e);
                throw e; // Stop execution if a migration fails
            }
        }

        await this.db.query('INSERT INTO tri.migrations (name) VALUES (?)', [fileName]);
        CLI.success(`Migration ${fileName} executed successfully.`);
    }
}
