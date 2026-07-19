import { fail, redirect } from '@sveltejs/kit';
import { checkPassword, createSession, findUserByEmail, listUsers } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
	return { users: listUsers(db) };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		const user = findUserByEmail(db, email);
		if (!user || !checkPassword(password)) {
			return fail(400, { message: 'Invalid user or password', email });
		}

		createSession(cookies, user.id);
		throw redirect(303, '/');
	}
};
