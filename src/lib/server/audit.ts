import { randomUUID } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import type { Db } from './db/types';
import { auditEvents, type AuditAction, type AuditEvent, type Status } from './db/schema';

export interface AuditEventInput {
	documentId: string;
	actorId: string;
	action: AuditAction;
	fromStatus: Status | null;
	toStatus: Status | null;
	comment?: string | null;
}

/** Appends an audit event. Never updates or deletes — the log is append-only. */
export function insertAuditEvent(db: Db, input: AuditEventInput): AuditEvent {
	const event: AuditEvent = {
		id: randomUUID(),
		documentId: input.documentId,
		actorId: input.actorId,
		action: input.action,
		fromStatus: input.fromStatus,
		toStatus: input.toStatus,
		comment: input.comment ?? null,
		createdAt: Date.now()
	};
	db.insert(auditEvents).values(event).run();
	return event;
}

export function listAuditEvents(db: Db, documentId: string): AuditEvent[] {
	return db
		.select()
		.from(auditEvents)
		.where(eq(auditEvents.documentId, documentId))
		.orderBy(asc(auditEvents.createdAt))
		.all();
}
