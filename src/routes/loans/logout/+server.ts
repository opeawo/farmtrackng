import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LOAN_COOKIE_NAME } from '$lib/server/loans/session';

export const GET: RequestHandler = async ({ cookies }) => {
	cookies.delete(LOAN_COOKIE_NAME, { path: '/' });
	throw redirect(303, '/loans');
};
