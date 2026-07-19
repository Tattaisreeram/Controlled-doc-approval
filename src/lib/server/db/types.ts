import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from './schema';

export type AppDatabase = BetterSQLite3Database<typeof schema>;
export type AppTransaction = Parameters<Parameters<AppDatabase['transaction']>[0]>[0];

/** Accepted by the service layer so the same functions run standalone or inside a transaction. */
export type Db = AppDatabase | AppTransaction;
