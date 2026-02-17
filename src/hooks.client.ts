import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = async ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();
	// In production: initialize and use Sentry here
	// Sentry.captureException(error, { extra: { event, errorId } });

	console.error(`[${errorId}]`, error);

	return {
		message: 'An unexpected error occurred',
		errorId
	};
};
