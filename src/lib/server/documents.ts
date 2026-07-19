import { randomUUID } from 'node:crypto';
import { eq, or } from 'drizzle-orm';
import type { Db } from './db/types';
import { documents, type Document, type User, type AuditEvent } from './db/schema';
import * as auditModule from './audit';
import { getTransitionDef, isValidFromStatus, type TransitionName } from './transitions';
import {
	NotFoundError,
	ForbiddenError,
	InvalidTransitionError,
	VersionConflictError,
	ValidationError
} from './errors';

function requireNonEmpty(value: string, field: string): string {
	const trimmed = value.trim();
	if (!trimmed) throw new ValidationError(`${field} must not be empty`);
	return trimmed;
}

export function createDocument(db: Db, params: { user: User; title: string; body: string }): Document {
	if (params.user.role !== 'author') {
		throw new ForbiddenError('Only authors can create documents');
	}
	const title = requireNonEmpty(params.title, 'Title');
	const body = requireNonEmpty(params.body, 'Body');

	return db.transaction((tx) => {
		const now = Date.now();
		const doc: Document = {
			id: randomUUID(),
			title,
			body,
			status: 'draft',
			ownerId: params.user.id,
			version: 1,
			createdAt: now,
			updatedAt: now
		};
		tx.insert(documents).values(doc).run();
		auditModule.insertAuditEvent(tx, {
			documentId: doc.id,
			actorId: params.user.id,
			action: 'created',
			fromStatus: null,
			toStatus: 'draft'
		});
		return doc;
	});
}

export function editDocument(
	db: Db,
	params: { user: User; documentId: string; title: string; body: string; expectedVersion: number }
): Document {
	return db.transaction((tx) => {
		const doc = tx.select().from(documents).where(eq(documents.id, params.documentId)).get();
		if (!doc) throw new NotFoundError('Document not found');
		if (doc.version !== params.expectedVersion) throw new VersionConflictError();
		if (doc.ownerId !== params.user.id) {
			throw new ForbiddenError('Only the owner can edit this document');
		}
		if (doc.status !== 'draft' && doc.status !== 'rejected') {
			throw new InvalidTransitionError(`Cannot edit a document in status '${doc.status}'`);
		}

		const title = requireNonEmpty(params.title, 'Title');
		const body = requireNonEmpty(params.body, 'Body');
		const updatedAt = Date.now();
		const version = doc.version + 1;

		tx.update(documents).set({ title, body, version, updatedAt }).where(eq(documents.id, doc.id)).run();
		auditModule.insertAuditEvent(tx, {
			documentId: doc.id,
			actorId: params.user.id,
			action: 'edited',
			fromStatus: doc.status,
			toStatus: doc.status
		});
		return { ...doc, title, body, version, updatedAt };
	});
}

export function transition(
	db: Db,
	params: {
		user: User;
		documentId: string;
		action: TransitionName;
		expectedVersion: number;
		comment?: string;
	}
): Document {
	return db.transaction((tx) => {
		const doc = tx.select().from(documents).where(eq(documents.id, params.documentId)).get();
		if (!doc) throw new NotFoundError('Document not found');

		// Checked before transition/permission legality: once a caller's view of the
		// document is stale, the current status can't be trusted either, so a stale
		// version should always surface as a conflict rather than a confusing
		// business-rule error about a status the caller never saw. See DESIGN.md.
		if (doc.version !== params.expectedVersion) throw new VersionConflictError();

		const def = getTransitionDef(params.action);
		if (!isValidFromStatus(params.action, doc.status)) {
			throw new InvalidTransitionError(`Cannot ${params.action} a document in status '${doc.status}'`);
		}
		if (!def.allowed({ user: params.user, doc })) {
			throw new ForbiddenError(`You are not allowed to ${params.action} this document`);
		}
		const trimmedComment = params.comment?.trim() ?? '';
		if (def.requiresComment && !trimmedComment) {
			throw new ValidationError('A comment is required for this action');
		}

		const updatedAt = Date.now();
		const version = doc.version + 1;

		tx.update(documents)
			.set({ status: def.to, version, updatedAt })
			.where(eq(documents.id, doc.id))
			.run();

		auditModule.insertAuditEvent(tx, {
			documentId: doc.id,
			actorId: params.user.id,
			action: def.action,
			fromStatus: doc.status,
			toStatus: def.to,
			comment: trimmedComment || null
		});

		return { ...doc, status: def.to, version, updatedAt };
	});
}

function canRead(user: User, doc: Document): boolean {
	if (doc.status === 'published') return true;
	if (user.role === 'admin') return true;
	if (doc.ownerId === user.id) return true;
	if (user.role === 'reviewer' && doc.status === 'submitted') return true;
	return false;
}

/** 404s (not 403s) for docs the user isn't allowed to see, so existence isn't leaked. */
export function getDocumentForUser(db: Db, params: { user: User; documentId: string }): Document {
	const doc = db.select().from(documents).where(eq(documents.id, params.documentId)).get();
	if (!doc || !canRead(params.user, doc)) throw new NotFoundError('Document not found');
	return doc;
}

export function listDocumentsForUser(db: Db, user: User): Document[] {
	switch (user.role) {
		case 'admin':
			return db.select().from(documents).all();
		case 'viewer':
			return db.select().from(documents).where(eq(documents.status, 'published')).all();
		case 'author':
			return db
				.select()
				.from(documents)
				.where(or(eq(documents.ownerId, user.id), eq(documents.status, 'published')))
				.all();
		case 'reviewer':
			return db
				.select()
				.from(documents)
				.where(
					or(
						eq(documents.status, 'submitted'),
						eq(documents.ownerId, user.id),
						eq(documents.status, 'published')
					)
				)
				.all();
		default: {
			const exhaustiveCheck: never = user.role;
			throw new Error(`Unhandled role: ${exhaustiveCheck}`);
		}
	}
}

/**
 * Viewers can see history for the published docs they can already read
 * (see DESIGN.md for the reasoning). Reuses getDocumentForUser so the same
 * 404-not-403 read authorization applies to history as to the document itself.
 */
export function getAuditHistoryForUser(db: Db, params: { user: User; documentId: string }): AuditEvent[] {
	getDocumentForUser(db, params);
	return auditModule.listAuditEvents(db, params.documentId);
}
