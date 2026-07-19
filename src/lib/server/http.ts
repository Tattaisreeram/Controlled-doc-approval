import { error, fail, redirect, isHttpError, isRedirect, type ActionFailure } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { requireUser } from './auth';
import { db } from './db';
import { httpStatusFor, UnauthenticatedError, VersionConflictError } from './errors';
import type { User } from './db/schema';

/** For use in load functions: redirect to /login instead of a bare 401 page. */
export function requireLoggedIn(cookies: Cookies): User {
	try {
		return requireUser(cookies, db);
	} catch (err) {
		if (err instanceof UnauthenticatedError) {
			throw redirect(303, '/login');
		}
		throw err;
	}
}

/** For use in load functions: maps domain errors to SvelteKit's error()/redirect(). */
export function loadOrThrow<T>(fn: () => T): T {
	try {
		return fn();
	} catch (err) {
		if (isHttpError(err) || isRedirect(err)) throw err;
		if (err instanceof UnauthenticatedError) throw redirect(303, '/login');
		throw error(httpStatusFor(err), err instanceof Error ? err.message : 'Unexpected error');
	}
}

export interface ActionErrorPayload {
	message: string;
	conflict: boolean;
}

/** For use in form actions: maps domain errors to a `fail()` the page can render. */
export function actionErrorOrThrow(err: unknown): ActionFailure<ActionErrorPayload> {
	if (err instanceof UnauthenticatedError) throw redirect(303, '/login');
	const status = httpStatusFor(err);
	const message = err instanceof Error ? err.message : 'Unexpected error';
	return fail(status, { message, conflict: err instanceof VersionConflictError });
}
