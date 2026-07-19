import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const ROLES = ['viewer', 'author', 'reviewer', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = [
	'draft',
	'submitted',
	'approved',
	'rejected',
	'published',
	'archived'
] as const;
export type Status = (typeof STATUSES)[number];

export const AUDIT_ACTIONS = [
	'created',
	'edited',
	'submitted',
	'approved',
	'rejected',
	'published',
	'archived',
	'reopened'
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name').notNull(),
	role: text('role').$type<Role>().notNull()
});

export const documents = sqliteTable('documents', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	body: text('body').notNull(),
	status: text('status').$type<Status>().notNull().default('draft'),
	ownerId: text('owner_id')
		.notNull()
		.references(() => users.id),
	version: integer('version').notNull().default(1),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export const auditEvents = sqliteTable('audit_events', {
	id: text('id').primaryKey(),
	documentId: text('document_id')
		.notNull()
		.references(() => documents.id),
	actorId: text('actor_id')
		.notNull()
		.references(() => users.id),
	action: text('action').$type<AuditAction>().notNull(),
	fromStatus: text('from_status').$type<Status | null>(),
	toStatus: text('to_status').$type<Status | null>(),
	comment: text('comment'),
	createdAt: integer('created_at').notNull()
});

export type User = typeof users.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
