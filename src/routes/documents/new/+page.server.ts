import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { createDocument } from '$lib/server/documents';
import { actionErrorOrThrow, requireLoggedIn } from '$lib/server/http';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = requireLoggedIn(cookies);
	if (user.role !== 'author') throw error(403, 'Only authors can create documents');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const user = requireLoggedIn(cookies);
		const formData = await request.formData();
		const title = formData.get('title')?.toString() ?? '';
		const body = formData.get('body')?.toString() ?? '';

		let doc;
		try {
			doc = createDocument(db, { user, title, body });
		} catch (err) {
			return actionErrorOrThrow(err);
		}

		throw redirect(303, `/documents/${doc.id}`);
	}
};
