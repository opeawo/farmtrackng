import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSnapshot } from '$lib/server/loans/cache';
import { normalisePhone, normaliseLoanId } from '$lib/server/loans/normalise';
import { makeSessionCookie, readSessionCookie, LOAN_COOKIE_NAME } from '$lib/server/loans/session';

export const load: PageServerLoad = async ({ cookies }) => {
	// If already logged in, jump straight to the loan page.
	const sess = readSessionCookie(cookies.get(LOAN_COOKIE_NAME));
	if (sess) throw redirect(303, `/loans/${encodeURIComponent(sess.loanId)}`);
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const phoneRaw = String(form.get('phone') || '');
		const loanIdRaw = String(form.get('loan_id') || '');

		const phone = normalisePhone(phoneRaw);
		const loanId = normaliseLoanId(loanIdRaw);

		if (!phone || !loanId) {
			return fail(400, {
				error: 'Please enter both your phone number and loan ID.',
				phone: phoneRaw,
				loan_id: loanIdRaw
			});
		}

		let snapshot;
		try {
			snapshot = await getSnapshot();
		} catch (err) {
			console.error('[loans/login] sheet fetch failed', err);
			return fail(500, {
				error: 'We could not reach the loan records right now. Please try again in a moment.',
				phone: phoneRaw,
				loan_id: loanIdRaw
			});
		}

		const match = snapshot.loans.find(
			(l) => l.loan_id === loanId && l.phone === phone
		);
		if (!match) {
			throw redirect(303, '/loans/not-found');
		}

		const cookie = makeSessionCookie(match.loan_id);
		cookies.set(cookie.name, cookie.value, cookie.options);
		throw redirect(303, `/loans/${encodeURIComponent(match.loan_id)}`);
	}
};
