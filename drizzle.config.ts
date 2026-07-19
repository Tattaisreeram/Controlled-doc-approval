import type { Config } from 'drizzle-kit';

export default {
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url: process.env.DATABASE_PATH ?? 'data/app.db'
	}
} satisfies Config;
