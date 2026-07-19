import { readFile } from 'node:fs/promises';
import { describe, it, expect } from 'vitest';
import { createTestDb } from './helpers/testDb';
import { createDocument, editDocument, transition } from '../src/lib/server/documents';
import { listAuditEvents } from '../src/lib/server/audit';

describe('audit log append-only guarantee (rule 14)', () => {
	it('the event count only grows across a sequence of operations, including a failed attempt', () => {
		const { db, alice, bob } = createTestDb();

		const doc = createDocument(db, { user: alice, title: 't', body: 'b' });
		let count = listAuditEvents(db, doc.id).length;
		expect(count).toBe(1);

		const edited = editDocument(db, {
			user: alice,
			documentId: doc.id,
			title: 't2',
			body: 'b2',
			expectedVersion: doc.version
		});
		expect(listAuditEvents(db, doc.id).length).toBeGreaterThan(count);
		count = listAuditEvents(db, doc.id).length;

		const submitted = transition(db, {
			user: alice,
			documentId: doc.id,
			action: 'submit',
			expectedVersion: edited.version
		});
		expect(listAuditEvents(db, doc.id).length).toBeGreaterThan(count);
		count = listAuditEvents(db, doc.id).length;

		transition(db, {
			user: bob,
			documentId: doc.id,
			action: 'reject',
			expectedVersion: submitted.version,
			comment: 'no'
		});
		expect(listAuditEvents(db, doc.id).length).toBeGreaterThan(count);
		count = listAuditEvents(db, doc.id).length;

		// A failed transition (invalid for the current status) must not add an event.
		expect(() =>
			transition(db, { user: bob, documentId: doc.id, action: 'publish', expectedVersion: 999 })
		).toThrow();
		expect(listAuditEvents(db, doc.id).length).toBe(count);
	});

	it('the audit module contains no update or delete statements', async () => {
		const source = await readFile(new URL('../src/lib/server/audit.ts', import.meta.url), 'utf-8');
		expect(source).not.toMatch(/\.update\(/);
		expect(source).not.toMatch(/\.delete\(/);
	});
});
