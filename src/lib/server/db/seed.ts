import { randomUUID } from 'node:crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { users, type Role } from './schema';

const SEED_USERS: { email: string; name: string; role: Role }[] = [
	{ email: 'alice@example.com', name: 'Alice', role: 'author' },
	{ email: 'carol@example.com', name: 'Carol', role: 'author' },
	{ email: 'bob@example.com', name: 'Bob', role: 'reviewer' },
	{ email: 'admin@example.com', name: 'Admin', role: 'admin' },
	{ email: 'viewer@example.com', name: 'Viewer', role: 'viewer' }
];

/** Idempotent: safe to call on every server start. */
export function seedDatabase(db: BetterSQLite3Database<typeof schema>): void {
	for (const seedUser of SEED_USERS) {
		const existing = db.select().from(users).where(eq(users.email, seedUser.email)).get();
		if (!existing) {
			db.insert(users)
				.values({ id: randomUUID(), email: seedUser.email, name: seedUser.name, role: seedUser.role })
				.run();
		}
	}
}

const isMainModule = process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
	const Database = (await import('better-sqlite3')).default;
	const { drizzle } = await import('drizzle-orm/better-sqlite3');
	const { runMigrations } = await import('./migrate');

	const sqlite = new Database(process.env.DATABASE_PATH ?? 'data/app.db');
	runMigrations(sqlite);
	const db = drizzle(sqlite, { schema });
	seedDatabase(db);
	console.log('Seed complete.');
	sqlite.close();
}
