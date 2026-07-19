import type { Status, AuditAction, User, Document } from './db/schema';

export const ACTIONS = ['submit', 'approve', 'reject', 'reopen', 'publish', 'archive'] as const;
export type TransitionName = (typeof ACTIONS)[number];

export interface TransitionContext {
	user: User;
	doc: Document;
}

export interface TransitionDef {
	from: Status | Status[];
	to: Status;
	action: AuditAction;
	allowed: (ctx: TransitionContext) => boolean;
	requiresComment?: boolean;
}

function isReviewerOrAdmin(user: User): boolean {
	return user.role === 'reviewer' || user.role === 'admin';
}

/**
 * The entire workflow as data. Both server-side enforcement (transition()
 * in documents.ts) and UI rendering (availableActions() below) read from
 * this single map, so the buttons a user sees and what the server permits
 * can never drift apart.
 */
export const TRANSITIONS: Record<TransitionName, TransitionDef> = {
	submit: {
		from: 'draft',
		to: 'submitted',
		action: 'submitted',
		allowed: (ctx) => ctx.user.role === 'author' && ctx.doc.ownerId === ctx.user.id
	},
	approve: {
		from: 'submitted',
		to: 'approved',
		action: 'approved',
		allowed: (ctx) => ctx.user.role === 'reviewer' && ctx.doc.ownerId !== ctx.user.id
	},
	reject: {
		from: 'submitted',
		to: 'rejected',
		action: 'rejected',
		requiresComment: true,
		allowed: (ctx) => ctx.user.role === 'reviewer' && ctx.doc.ownerId !== ctx.user.id
	},
	reopen: {
		from: 'rejected',
		to: 'draft',
		action: 'reopened',
		allowed: (ctx) => ctx.user.role === 'author' && ctx.doc.ownerId === ctx.user.id
	},
	publish: {
		from: 'approved',
		to: 'published',
		action: 'published',
		allowed: (ctx) => isReviewerOrAdmin(ctx.user)
	},
	archive: {
		from: ['draft', 'submitted', 'approved', 'published'],
		to: 'archived',
		action: 'archived',
		allowed: (ctx) => ctx.user.role === 'admin'
	}
};

function fromMatches(def: TransitionDef, status: Status): boolean {
	return Array.isArray(def.from) ? def.from.includes(status) : def.from === status;
}

export function getTransitionDef(action: TransitionName): TransitionDef {
	return TRANSITIONS[action];
}

/**
 * Actions currently valid for this user on this document: the current
 * status matches the transition's `from`, and the role/ownership check
 * passes. Used to render action buttons and, independently, to enforce
 * the same rule server-side before mutating.
 */
export function availableActions(user: User, doc: Document): TransitionName[] {
	return ACTIONS.filter((name) => {
		const def = TRANSITIONS[name];
		return fromMatches(def, doc.status) && def.allowed({ user, doc });
	});
}

export function isValidFromStatus(action: TransitionName, status: Status): boolean {
	return fromMatches(TRANSITIONS[action], status);
}
