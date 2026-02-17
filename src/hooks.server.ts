import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();
	// In production: initialize and use Sentry here
	// Sentry.captureException(error, { extra: { event, errorId } });

	console.error(`[${errorId}]`, error);

	return {
		message: 'An internal error occurred',
		errorId
	};
};
