import type Database from 'better-sqlite3';
import { ROLES, STATUSES, AUDIT_ACTIONS } from './schema';

/**
 * Programmatic, idempotent schema creation. Chosen over drizzle-kit's
 * generate/migrate file pipeline so a fresh checkout needs zero manual
 * migration steps: the schema is created on first connection, whether
 * that connection is the on-disk dev database or an in-memory test one.
 */
export function runMigrations(sqlite: Database.Database): void {
	sqlite.pragma('foreign_keys = ON');

	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL,
			role TEXT NOT NULL CHECK (role IN (${ROLES.map((r) => `'${r}'`).join(', ')}))
		);

		CREATE TABLE IF NOT EXISTS documents (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			body TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (${STATUSES.map((s) => `'${s}'`).join(', ')})),
			owner_id TEXT NOT NULL REFERENCES users(id),
			version INTEGER NOT NULL DEFAULT 1,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);

		CREATE TABLE IF NOT EXISTS audit_events (
			id TEXT PRIMARY KEY,
			document_id TEXT NOT NULL REFERENCES documents(id),
			actor_id TEXT NOT NULL REFERENCES users(id),
			action TEXT NOT NULL CHECK (action IN (${AUDIT_ACTIONS.map((a) => `'${a}'`).join(', ')})),
			from_status TEXT,
			to_status TEXT,
			comment TEXT,
			created_at INTEGER NOT NULL
		);

		CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
		CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
		CREATE INDEX IF NOT EXISTS idx_audit_document ON audit_events(document_id);
	`);
}
