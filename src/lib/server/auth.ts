import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Db } from './db/types';
import { users, type User } from './db/schema';
import { UnauthenticatedError } from './errors';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Falls back to a fixed dev value so the app runs with zero setup; override
// via the SESSION_SECRET env var for anything beyond local grading.
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-only-secret-change-me-please-1234567890';

const SHARED_PASSWORD = 'password123';

function sign(userId: string): string {
	return createHmac('sha256', SESSION_SECRET).update(userId).digest('hex');
}

function verify(userId: string, signature: string): boolean {
	const expected = sign(userId);
	const expectedBuf = Buffer.from(expected, 'hex');
	const actualBuf = Buffer.from(signature, 'hex');
	if (expectedBuf.length !== actualBuf.length) return false;
	return timingSafeEqual(expectedBuf, actualBuf);
}

/** Verifies the shared seeded-user password. */
export function checkPassword(password: string): boolean {
	return password === SHARED_PASSWORD;
}

export function createSession(cookies: Cookies, userId: string): void {
	const value = `${userId}.${sign(userId)}`;
	cookies.set(SESSION_COOKIE, value, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: SESSION_MAX_AGE_SECONDS
	});
}

export function destroySession(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

function readSessionUserId(cookies: Cookies): string | null {
	const raw = cookies.get(SESSION_COOKIE);
	if (!raw) return null;
	const dotIndex = raw.lastIndexOf('.');
	if (dotIndex === -1) return null;
	const userId = raw.slice(0, dotIndex);
	const signature = raw.slice(dotIndex + 1);
	if (!verify(userId, signature)) return null;
	return userId;
}

/** Returns the logged-in user for this request, or null if unauthenticated. */
export function getUser(cookies: Cookies, db: Db): User | null {
	const userId = readSessionUserId(cookies);
	if (!userId) return null;
	const user = db.select().from(users).where(eq(users.id, userId)).get();
	return user ?? null;
}

/** Returns the logged-in user, or throws UnauthenticatedError (maps to HTTP 401). */
export function requireUser(cookies: Cookies, db: Db): User {
	const user = getUser(cookies, db);
	if (!user) throw new UnauthenticatedError();
	return user;
}

/** Lists all seeded users for the login picker. */
export function listUsers(db: Db): User[] {
	return db.select().from(users).all();
}

export function findUserByEmail(db: Db, email: string): User | null {
	return db.select().from(users).where(eq(users.email, email)).get() ?? null;
}
