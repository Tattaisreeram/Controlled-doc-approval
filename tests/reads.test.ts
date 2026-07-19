import { describe, it, expect } from 'vitest';
import { createTestDb } from './helpers/testDb';
import { createDocument, getDocumentForUser, listDocumentsForUser, transition } from '../src/lib/server/documents';
import { NotFoundError } from '../src/lib/server/errors';

describe('viewer read isolation (rule 10)', () => {
	it('viewer listing returns only published documents', () => {
		const { db, alice, bob, viewer } = createTestDb();

		createDocument(db, { user: alice, title: 'still a draft', body: 'b' });

		const toPublish = createDocument(db, { user: alice, title: 'will be published', body: 'b' });
		const submitted = transition(db, {
			user: alice,
			documentId: toPublish.id,
			action: 'submit',
			expectedVersion: toPublish.version
		});
		const approved = transition(db, {
			user: bob,
			documentId: toPublish.id,
			action: 'approve',
			expectedVersion: submitted.version
		});
		const published = transition(db, {
			user: bob,
			documentId: toPublish.id,
			action: 'publish',
			expectedVersion: approved.version
		});

		const visible = listDocumentsForUser(db, viewer);
		expect(visible.map((d) => d.id)).toEqual([published.id]);
	});

	it('viewer fetching a draft by id gets NotFoundError, not ForbiddenError', () => {
		const { db, alice, viewer } = createTestDb();
		const draft = createDocument(db, { user: alice, title: 'draft', body: 'b' });

		expect(() => getDocumentForUser(db, { user: viewer, documentId: draft.id })).toThrow(
			NotFoundError
		);
	});
});
