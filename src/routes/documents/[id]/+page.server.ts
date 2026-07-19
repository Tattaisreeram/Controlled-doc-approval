import { inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { getAuditHistoryForUser, getDocumentForUser, transition } from '$lib/server/documents';
import { actionErrorOrThrow, loadOrThrow, requireLoggedIn } from '$lib/server/http';
import { availableActions, ACTIONS, type TransitionName } from '$lib/server/transitions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params }) => {
	const user = requireLoggedIn(cookies);

	return loadOrThrow(() => {
		const doc = getDocumentForUser(db, { user, documentId: params.id });
		const history = getAuditHistoryForUser(db, { user, documentId: params.id });

		const actorIds = [...new Set(history.map((h) => h.actorId))];
		const actors = actorIds.length
			? db.select().from(users).where(inArray(users.id, actorIds)).all()
			: [];
		const actorNameById = new Map(actors.map((a) => [a.id, a.name]));

		return {
			doc,
			history: history.map((h) => ({ ...h, actorName: actorNameById.get(h.actorId) ?? 'Unknown' })),
			actions: availableActions(user, doc),
			canEdit:
				doc.ownerId === user.id && (doc.status === 'draft' || doc.status === 'rejected')
		};
	});
};

function handleTransition(action: TransitionName) {
	return async ({ request, cookies, params }: Parameters<Actions[string]>[0]) => {
		const user = requireLoggedIn(cookies);
		const formData = await request.formData();
		const expectedVersion = Number(formData.get('expectedVersion'));
		const comment = formData.get('comment')?.toString();

		try {
			transition(db, { user, documentId: params.id, action, expectedVersion, comment });
		} catch (err) {
			return actionErrorOrThrow(err);
		}
		return { success: true };
	};
}

export const actions: Actions = Object.fromEntries(
	ACTIONS.map((name) => [name, handleTransition(name)])
) as Actions;
