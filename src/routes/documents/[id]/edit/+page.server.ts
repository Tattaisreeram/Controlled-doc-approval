import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { editDocument, getDocumentForUser } from '$lib/server/documents';
import { actionErrorOrThrow, loadOrThrow, requireLoggedIn } from '$lib/server/http';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params }) => {
	const user = requireLoggedIn(cookies);

	return loadOrThrow(() => {
		const doc = getDocumentForUser(db, { user, documentId: params.id });
		if (doc.ownerId !== user.id || (doc.status !== 'draft' && doc.status !== 'rejected')) {
			throw error(403, 'This document cannot be edited by you right now');
		}
		return { doc };
	});
};

export const actions: Actions = {
	default: async ({ request, cookies, params }) => {
		const user = requireLoggedIn(cookies);
		const formData = await request.formData();
		const title = formData.get('title')?.toString() ?? '';
		const body = formData.get('body')?.toString() ?? '';
		const expectedVersion = Number(formData.get('expectedVersion'));

		try {
			editDocument(db, { user, documentId: params.id, title, body, expectedVersion });
		} catch (err) {
			return actionErrorOrThrow(err);
		}

		throw redirect(303, `/documents/${params.id}`);
	}
};
