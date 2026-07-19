import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/lib/server/db/schema';
import { runMigrations } from '../../src/lib/server/db/migrate';
import { seedDatabase } from '../../src/lib/server/db/seed';
import type { AppDatabase } from '../../src/lib/server/db/types';
import type { User } from '../../src/lib/server/db/schema';

export interface TestContext {
	db: AppDatabase;
	alice: User; // author
	carol: User; // author (second author, for cross-owner checks)
	bob: User; // reviewer
	admin: User; // admin
	viewer: User; // viewer
}

/** Fresh, migrated, seeded in-memory database — call once per test. */
export function createTestDb(): TestContext {
	const sqlite = new Database(':memory:');
	runMigrations(sqlite);
	const db = drizzle(sqlite, { schema });
	seedDatabase(db);

	const allUsers = db.select().from(schema.users).all();
	const byEmail = (email: string): User => {
		const user = allUsers.find((u) => u.email === email);
		if (!user) throw new Error(`seed user missing: ${email}`);
		return user;
	};

	return {
		db,
		alice: byEmail('alice@example.com'),
		carol: byEmail('carol@example.com'),
		bob: byEmail('bob@example.com'),
		admin: byEmail('admin@example.com'),
		viewer: byEmail('viewer@example.com')
	};
}
