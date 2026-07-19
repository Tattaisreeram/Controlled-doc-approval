import { describe, it, expect } from 'vitest';
import { createTestDb } from './helpers/testDb';
import { createDocument, getDocumentForUser, transition } from '../src/lib/server/documents';
import { listAuditEvents } from '../src/lib/server/audit';
import { VersionConflictError } from '../src/lib/server/errors';

describe('optimistic concurrency (rule 11)', () => {
	it('a stale expectedVersion is rejected once a concurrent write has landed, and writes no audit event', () => {
		const { db, alice, bob } = createTestDb();

		const doc = createDocument(db, { user: alice, title: 't', body: 'b' });
		const loadedByBoth = transition(db, {
			user: alice,
			documentId: doc.id,
			action: 'submit',
			expectedVersion: doc.version
		});

		// User A approves using the version both "loaded" — succeeds.
		const approved = transition(db, {
			user: bob,
			documentId: doc.id,
			action: 'approve',
			expectedVersion: loadedByBoth.version
		});
		expect(approved.status).toBe('approved');

		const historyCountAfterApprove = listAuditEvents(db, doc.id).length;

		// User B rejects using the same (now stale) version — must conflict.
		expect(() =>
			transition(db, {
				user: bob,
				documentId: doc.id,
				action: 'reject',
				expectedVersion: loadedByBoth.version,
				comment: 'too slow'
			})
		).toThrow(VersionConflictError);

		const fresh = getDocumentForUser(db, { user: alice, documentId: doc.id });
		expect(fresh.status).toBe('approved');
		expect(fresh.version).toBe(approved.version);

		expect(listAuditEvents(db, doc.id)).toHaveLength(historyCountAfterApprove);
	});
});
