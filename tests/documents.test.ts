import { describe, it, expect } from 'vitest';
import { createTestDb } from './helpers/testDb';
import { createDocument, editDocument, transition } from '../src/lib/server/documents';
import { ForbiddenError, InvalidTransitionError, ValidationError } from '../src/lib/server/errors';

describe('createDocument', () => {
	it('rule 2: a viewer cannot create a document', () => {
		const { db, viewer } = createTestDb();
		expect(() => createDocument(db, { user: viewer, title: 'x', body: 'y' })).toThrow(
			ForbiddenError
		);
	});

	it('rule 5: rejects an empty title or body on create', () => {
		const { db, alice } = createTestDb();
		expect(() => createDocument(db, { user: alice, title: '  ', body: 'body' })).toThrow(
			ValidationError
		);
		expect(() => createDocument(db, { user: alice, title: 'title', body: '   ' })).toThrow(
			ValidationError
		);
	});
});

describe('editDocument', () => {
	it("rule 3: an author cannot edit another author's draft", () => {
		const { db, alice, carol } = createTestDb();
		const doc = createDocument(db, { user: alice, title: 'Alice draft', body: 'body' });

		expect(() =>
			editDocument(db, {
				user: carol,
				documentId: doc.id,
				title: 'hijacked',
				body: 'hijacked',
				expectedVersion: doc.version
			})
		).toThrow(ForbiddenError);
	});

	it('rule 4: an author cannot edit their own document once submitted, published, or archived', () => {
		const { db, alice, bob, admin } = createTestDb();

		const doc = createDocument(db, { user: alice, title: 't', body: 'b' });
		const submitted = transition(db, {
			user: alice,
			documentId: doc.id,
			action: 'submit',
			expectedVersion: doc.version
		});
		expect(() =>
			editDocument(db, {
				user: alice,
				documentId: doc.id,
				title: 'x',
				body: 'y',
				expectedVersion: submitted.version
			})
		).toThrow(InvalidTransitionError);

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
		expect(() =>
			editDocument(db, {
				user: alice,
				documentId: doc.id,
				title: 'x',
				body: 'y',
				expectedVersion: published.version
			})
		).toThrow(InvalidTransitionError);

		const archived = transition(db, {
			user: admin,
			documentId: doc.id,
			action: 'archive',
			expectedVersion: published.version
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
	});

	it('rule 5: rejects an empty title or body on edit', () => {
		const { db, alice } = createTestDb();
		const doc = createDocument(db, { user: alice, title: 't', body: 'b' });

		expect(() =>
			editDocument(db, {
				user: alice,
				documentId: doc.id,
				title: '   ',
				body: 'b',
				expectedVersion: doc.version
			})
		).toThrow(ValidationError);
		expect(() =>
			editDocument(db, {
				user: alice,
				documentId: doc.id,
				title: 't',
				body: '  ',
				expectedVersion: doc.version
			})
		).toThrow(ValidationError);
	});

	it('allows the owner to edit their own draft, bumping the version', () => {
		const { db, alice } = createTestDb();
		const doc = createDocument(db, { user: alice, title: 't', body: 'b' });
		const edited = editDocument(db, {
			user: alice,
			documentId: doc.id,
			title: 'updated',
			body: 'updated body',
			expectedVersion: doc.version
		});
		expect(edited.title).toBe('updated');
		expect(edited.version).toBe(doc.version + 1);
	});
});
