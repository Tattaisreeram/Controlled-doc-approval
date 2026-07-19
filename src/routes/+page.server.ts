import { db } from '$lib/server/db';
import { listDocumentsForUser } from '$lib/server/documents';
import { requireLoggedIn } from '$lib/server/http';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = requireLoggedIn(cookies);
	const documents = listDocumentsForUser(db, user)
		.slice()
		.sort((a, b) => b.updatedAt - a.updatedAt);
	return { documents };
};
