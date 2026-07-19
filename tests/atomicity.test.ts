import { describe, it, expect, vi, afterEach } from 'vitest';
import { createTestDb } from './helpers/testDb';
import { createDocument, getDocumentForUser, transition } from '../src/lib/server/documents';
import * as auditModule from '../src/lib/server/audit';

describe('transaction atomicity (rule 12)', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('rolls back the status update if the audit insert fails, in the same transaction', () => {
		const { db, alice, bob } = createTestDb();

		const doc = createDocument(db, { user: alice, title: 't', body: 'b' });
		const submitted = transition(db, {
			user: alice,
			documentId: doc.id,
			action: 'submit',
			expectedVersion: doc.version
		});

		vi.spyOn(auditModule, 'insertAuditEvent').mockImplementation(() => {
			throw new Error('simulated audit failure');
		});

		expect(() =>
			transition(db, {
				user: bob,
				documentId: doc.id,
				action: 'approve',
				expectedVersion: submitted.version
			})
		).toThrow('simulated audit failure');

		vi.restoreAllMocks();

		// The failed write must not have persisted: status and version stay as before the attempt.
		const fresh = getDocumentForUser(db, { user: alice, documentId: doc.id });
		expect(fresh.status).toBe('submitted');
		expect(fresh.version).toBe(submitted.version);
	});
});
