import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSnapshot } from '$lib/server/loans/cache';
import { LOAN_COOKIE_NAME, readSessionCookie } from '$lib/server/loans/session';
import { buildLoanView, todayIso } from '$lib/server/loans/status';
import { getThresholds } from '$lib/server/loans/thresholds';
import { normaliseLoanId } from '$lib/server/loans/normalise';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const sess = readSessionCookie(cookies.get(LOAN_COOKIE_NAME));
	const requested = normaliseLoanId(params.loanId);
	if (!sess || sess.loanId !== requested) {
		throw redirect(303, '/loans');
	}

	let snapshot;
	try {
		snapshot = await getSnapshot();
	} catch (err) {
		console.error('[loans/view] sheet fetch failed', err);
		throw error(503, 'Unable to load loan records right now. Please try again shortly.');
	}

	const loan = snapshot.loans.find((l) => l.loan_id === requested);
	if (!loan) throw redirect(303, '/loans/not-found');

	const view = buildLoanView(loan, snapshot.installments, todayIso(), getThresholds());

	return {
		view,
		fetched_at: snapshot.fetched_at
	};
};
