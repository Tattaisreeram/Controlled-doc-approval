import { randomUUID } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { createTestDb } from './helpers/testDb';
import { createDocument, editDocument, transition, getDocumentForUser } from '../src/lib/server/documents';
import { listAuditEvents } from '../src/lib/server/audit';
import { documents } from '../src/lib/server/db/schema';
import { ForbiddenError, InvalidTransitionError, ValidationError } from '../src/lib/server/errors';

describe('happy path (rule 6)', () => {
	it('draft -> submitted -> approved -> published, one audit event per step', () => {
		const { db, alice, bob } = createTestDb();
		const doc = createDocument(db, { user: alice, title: 't', body: 'b' });

		const submitted = transition(db, {
			user: alice,
			documentId: doc.id,
			action: 'submit',
			expectedVersion: doc.version
		});
		const approved = transition(db, {
			user: bob,
			documentId: doc.id,
			action: 'approve',
			expectedVersion: submitted.version
		});
		const published = transition(db, {
			user: bob,
			documentId: doc.id,
			action: 'publish',
			expectedVersion: approved.version
		});

		expect(published.status).toBe('published');

		const history = listAuditEvents(db, doc.id);
		expect(history).toHaveLength(4);
		expect(history.map((h) => h.action)).toEqual(['created', 'submitted', 'approved', 'published']);
		expect(history[1]).toMatchObject({ fromStatus: 'draft', toStatus: 'submitted' });
		expect(history[2]).toMatchObject({ fromStatus: 'submitted', toStatus: 'approved' });
		expect(history[3]).toMatchObject({ fromStatus: 'approved', toStatus: 'published' });
	});
});

describe('invalid transitions (rule 7)', () => {
	it('rejects actions that do not apply to the current status', () => {
		const { db, alice, bob } = createTestDb();
		const doc = createDocument(db, { user: alice, title: 't', body: 'b' });

		expect(() =>
			transition(db, { user: bob, documentId: doc.id, action: 'publish', expectedVersion: doc.version })
		).toThrow(InvalidTransitionError);
		expect(() =>
			transition(db, { user: bob, documentId: doc.id, action: 'approve', expectedVersion: doc.version })
		).toThrow(InvalidTransitionError);

		const submitted = transition(db, {
			user: alice,
			documentId: doc.id,
			action: 'submit',
			expectedVersion: doc.version
		});
		expect(() =>
			transition(db, {
				user: alice,
				documentId: doc.id,
				action: 'submit',
				expectedVersion: submitted.version
			})
		).toThrow(InvalidTransitionError);

		const approved = transition(db, {
			user: bob,
			documentId: doc.id,
			action: 'approve',
			expectedVersion: submitted.version
		});
		expect(() =>
			transition(db, {
				user: bob,
				documentId: doc.id,
				action: 'reject',
				expectedVersion: approved.version,
				comment: 'too late'
			})
		).toThrow(InvalidTransitionError);
	});
});

describe('reviewer ownership (rule 8)', () => {
	it('a reviewer cannot approve or reject a document they own', () => {
		const { db, bob } = createTestDb();
		const now = Date.now();
		const doc = {
			id: randomUUID(),
			title: "bob's doc",
			body: 'body',
			status: 'submitted' as const,
			ownerId: bob.id,
			version: 1,
			createdAt: now,
			updatedAt: now
		};
		db.insert(documents).values(doc).run();

		expect(() =>
			transition(db, { user: bob, documentId: doc.id, action: 'approve', expectedVersion: 1 })
		).toThrow(ForbiddenError);
		expect(() =>
			transition(db, {
				user: bob,
				documentId: doc.id,
				action: 'reject',
				expectedVersion: 1,
				comment: 'no'
			})
		).toThrow(ForbiddenError);
	});
});

describe('rejection comment (rule 9)', () => {
	it('rejects without a comment, succeeds and stores the comment with one', () => {
		const { db, alice, bob } = createTestDb();
		const doc = createDocument(db, { user: alice, title: 't', body: 'b' });
		const submitted = transition(db, {
			user: alice,
			documentId: doc.id,
			action: 'submit',
			expectedVersion: doc.version
		});

		expect(() =>
			transition(db, {
				user: bob,
				documentId: doc.id,
				action: 'reject',
				expectedVersion: submitted.version
			})
		).toThrow(ValidationError);
		expect(() =>
			transition(db, {
				user: bob,
				documentId: doc.id,
				action: 'reject',
				expectedVersion: submitted.version,
				comment: '   '
			})
		).toThrow(ValidationError);

		const rejected = transition(db, {
			user: bob,
			documentId: doc.id,
			action: 'reject',
			expectedVersion: submitted.version,
			comment: 'Needs more detail'
		});
		expect(rejected.status).toBe('rejected');

		const history = listAuditEvents(db, doc.id);
		const rejectEvent = history.find((h) => h.action === 'rejected');
		expect(rejectEvent?.comment).toBe('Needs more detail');
	});
});

describe('archive (rule 13)', () => {
	it('admin can archive from draft, submitted, approved, or published', () => {
		const { db, alice, bob, admin } = createTestDb();

		const draftDoc = createDocument(db, { user: alice, title: 'd1', body: 'b' });
		expect(
			transition(db, {
				user: admin,
				documentId: draftDoc.id,
				action: 'archive',
				expectedVersion: draftDoc.version
			}).status
		).toBe('archived');

		const doc2 = createDocument(db, { user: alice, title: 'd2', body: 'b' });
		const submitted2 = transition(db, {
			user: alice,
			documentId: doc2.id,
			action: 'submit',
			expectedVersion: doc2.version
		});
		expect(
			transition(db, {
				user: admin,
				documentId: doc2.id,
				action: 'archive',
				expectedVersion: submitted2.version
			}).status
		).toBe('archived');

		const doc3 = createDocument(db, { user: alice, title: 'd3', body: 'b' });
		const submitted3 = transition(db, {
			user: alice,
			documentId: doc3.id,
			action: 'submit',
			expectedVersion: doc3.version
		});
		const approved3 = transition(db, {
			user: bob,
			documentId: doc3.id,
			action: 'approve',
			expectedVersion: submitted3.version
		});
		expect(
			transition(db, {
				user: admin,
				documentId: doc3.id,
				action: 'archive',
				expectedVersion: approved3.version
			}).status
		).toBe('archived');

		const doc4 = createDocument(db, { user: alice, title: 'd4', body: 'b' });
		const submitted4 = transition(db, {
			user: alice,
			documentId: doc4.id,
			action: 'submit',
			expectedVersion: doc4.version
		});
		const approved4 = transition(db, {
			user: bob,
			documentId: doc4.id,
			action: 'approve',
			expectedVersion: submitted4.version
		});
		const published4 = transition(db, {
			user: bob,
			documentId: doc4.id,
			action: 'publish',
			expectedVersion: approved4.version
		});
		expect(
			transition(db, {
				user: admin,
				documentId: doc4.id,
				action: 'archive',
				expectedVersion: published4.version
			}).status
		).toBe('archived');
	});

	it('a non-admin cannot archive', () => {
		const { db, alice, bob } = createTestDb();
		const doc = createDocument(db, { user: alice, title: 't', body: 'b' });

		expect(() =>
			transition(db, { user: alice, documentId: doc.id, action: 'archive', expectedVersion: doc.version })
		).toThrow(ForbiddenError);
		expect(() =>
			transition(db, { user: bob, documentId: doc.id, action: 'archive', expectedVersion: doc.version })
		).toThrow(ForbiddenError);
	});

	it('an archived document cannot be edited or published', () => {
		const { db, alice, admin } = createTestDb();
		const doc = createDocument(db, { user: alice, title: 't', body: 'b' });
		const archived = transition(db, {
			user: admin,
			documentId: doc.id,
			action: 'archive',
			expectedVersion: doc.version
		});

		expect(() =>
			editDocument(db, {
				user: alice,
				documentId: doc.id,
				title: 'x',
				body: 'y',
				expectedVersion: archived.version
			})
		).toThrow(InvalidTransitionError);
		expect(() =>
			transition(db, {
				user: admin,
				documentId: doc.id,
				action: 'publish',
				expectedVersion: archived.version
			})
		).toThrow(InvalidTransitionError);

		const fresh = getDocumentForUser(db, { user: admin, documentId: doc.id });
		expect(fresh.status).toBe('archived');
	});
});
