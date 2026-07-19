import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { runMigrations } from './migrate';
import { seedDatabase } from './seed';

const DATABASE_PATH = process.env.DATABASE_PATH ?? 'data/app.db';

if (DATABASE_PATH !== ':memory:') {
	fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
}

const sqlite = new Database(DATABASE_PATH);
sqlite.pragma('journal_mode = WAL');

runMigrations(sqlite);

export const db = drizzle(sqlite, { schema });

seedDatabase(db);
