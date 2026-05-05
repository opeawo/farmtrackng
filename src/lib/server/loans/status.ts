// Pure status calculator. No I/O. Easy to unit-test.

import type { Installment, InstallmentStatus, InstallmentView, LoanView, Loan } from './types';

const MS_PER_DAY = 86_400_000;

function daysBetween(fromIso: string, toIso: string): number {
	const a = Date.parse(fromIso + 'T00:00:00Z');
	const b = Date.parse(toIso + 'T00:00:00Z');
	if (isNaN(a) || isNaN(b)) return 0;
	return Math.round((b - a) / MS_PER_DAY);
}

export interface StatusThresholds {
	lateDays: number; // default 1
	atRiskDays: number; // default 5
}

export function statusForInstallment(
	inst: Installment,
	todayIso: string,
	thresholds: StatusThresholds
): InstallmentView {
	const due = inst.due_date;
	const paid = inst.payment_date != null && inst.payment_date !== '';

	// today - due. Positive => overdue. Negative => not yet due.
	const diff = due ? daysBetween(due, todayIso) : 0;
	const days_overdue = diff > 0 ? diff : 0;
	const days_until_due = -diff;

	let status: InstallmentStatus;
	if (paid) {
		status = 'paid';
	} else if (diff < 0) {
		status = 'not_yet_due';
	} else if (diff < thresholds.lateDays) {
		// Due today but not yet flagged late (lateDays defaults to 1)
		status = 'on_track';
	} else if (diff < thresholds.atRiskDays) {
		status = 'late';
	} else {
		status = 'at_risk';
	}

	return { ...inst, status, days_overdue, days_until_due };
}

const RANK: Record<InstallmentStatus, number> = {
	at_risk: 4,
	late: 3,
	on_track: 2,
	not_yet_due: 1,
	paid: 0
};

/** Worst active installment status, ignoring paid rows. If all paid, returns 'paid'. */
export function rollupAccountStatus(views: InstallmentView[]): InstallmentStatus {
	const active = views.filter((v) => v.status !== 'paid');
	if (active.length === 0) return views.length === 0 ? 'on_track' : 'paid';
	let worst: InstallmentStatus = 'not_yet_due';
	for (const v of active) {
		if (RANK[v.status] > RANK[worst]) worst = v.status;
	}
	// "On track" is the green non-paid label — if the worst is just not_yet_due,
	// surface it as on_track for the badge.
	return worst === 'not_yet_due' ? 'on_track' : worst;
}

export function buildLoanView(
	loan: Loan,
	installments: Installment[],
	todayIso: string,
	thresholds: StatusThresholds
): LoanView {
	const views = installments
		.filter((i) => i.loan_id === loan.loan_id)
		.sort((a, b) => a.installment_no - b.installment_no)
		.map((i) => statusForInstallment(i, todayIso, thresholds));

	const next_payment =
		views.find((v) => v.status !== 'paid' && (v.status === 'on_track' || v.status === 'not_yet_due')) ||
		views.find((v) => v.status !== 'paid') ||
		null;

	const total_paid_ngn = views
		.filter((v) => v.status === 'paid')
		.reduce((s, v) => s + (v.amount_due_ngn || 0), 0);
	const outstanding_ngn = Math.max(0, (loan.total_repayable_ngn || 0) - total_paid_ngn);

	return {
		loan,
		installments: views,
		account_status: rollupAccountStatus(views),
		next_payment,
		total_paid_ngn,
		outstanding_ngn
	};
}

export function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}
