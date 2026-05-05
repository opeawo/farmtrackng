import type { LayoutServerLoad } from './$types';
import { LOAN_COOKIE_NAME, readSessionCookie } from '$lib/server/loans/session';

export const load: LayoutServerLoad = ({ cookies }) => {
	const sess = readSessionCookie(cookies.get(LOAN_COOKIE_NAME));
	return { authed: sess != null };
};
