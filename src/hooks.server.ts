import type { Handle } from '@sveltejs/kit';
import { getUser } from '$lib/server/auth';
import { db } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = getUser(event.cookies, db);
	return resolve(event);
};
