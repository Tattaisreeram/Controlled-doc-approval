import { describe, it, expect } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { createTestDb } from './helpers/testDb';
import { createSession, requireUser } from '../src/lib/server/auth';
import { UnauthenticatedError } from '../src/lib/server/errors';

function fakeCookies(): Cookies {
	const store = new Map<string, string>();
	const cookies: Pick<Cookies, 'get' | 'getAll' | 'set' | 'delete' | 'serialize'> = {
		get: (name) => store.get(name),
		getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
		set: (name, value) => {
			store.set(name, value);
		},
		delete: (name) => {
			store.delete(name);
		},
		serialize: () => ''
	};
	return cookies as Cookies;
}

describe('requireUser (rule 1: unauthenticated access is rejected)', () => {
	it('throws UnauthenticatedError when no session cookie is present', () => {
		const { db } = createTestDb();
		expect(() => requireUser(fakeCookies(), db)).toThrow(UnauthenticatedError);
	});

	it('returns the user for a validly signed session cookie', () => {
		const { db, alice } = createTestDb();
		const cookies = fakeCookies();
		createSession(cookies, alice.id);
		expect(requireUser(cookies, db).id).toBe(alice.id);
	});

	it('rejects a tampered session cookie', () => {
		const { db, alice } = createTestDb();
		const cookies = fakeCookies();
		createSession(cookies, alice.id);

		const raw = cookies.get('session') ?? '';
		const signature = raw.slice(raw.lastIndexOf('.'));
		cookies.set('session', `not-alice${signature}`, { path: '/' });

		expect(() => requireUser(cookies, db)).toThrow(UnauthenticatedError);
	});
});
