export class UnauthenticatedError extends Error {
	constructor(message = 'Authentication required') {
		super(message);
		this.name = 'UnauthenticatedError';
	}
}

export class ForbiddenError extends Error {
	constructor(message = 'You are not allowed to do that') {
		super(message);
		this.name = 'ForbiddenError';
	}
}

export class NotFoundError extends Error {
	constructor(message = 'Not found') {
		super(message);
		this.name = 'NotFoundError';
	}
}

export class InvalidTransitionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InvalidTransitionError';
	}
}

export class VersionConflictError extends Error {
	constructor(
		message = 'This document was changed by someone else after you loaded the page. Review the current state below and retry.'
	) {
		super(message);
		this.name = 'VersionConflictError';
	}
}

export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ValidationError';
	}
}

export type AppError =
	| UnauthenticatedError
	| ForbiddenError
	| NotFoundError
	| InvalidTransitionError
	| VersionConflictError
	| ValidationError;

/** Single place mapping domain errors to HTTP status codes. */
export function httpStatusFor(err: unknown): number {
	if (err instanceof UnauthenticatedError) return 401;
	if (err instanceof ForbiddenError) return 403;
	if (err instanceof NotFoundError) return 404;
	if (err instanceof InvalidTransitionError) return 409;
	if (err instanceof VersionConflictError) return 409;
	if (err instanceof ValidationError) return 400;
	return 500;
}
