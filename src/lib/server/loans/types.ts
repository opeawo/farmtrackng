// Loan tracker domain types. Server-only (the sheet is read via service account).

export interface Loan {
	loan_id: string;
	business_name: string;
	contact_person: string;
	email: string;
	phone: string; // normalised to +234XXXXXXXXXX
	equipment_financed: string;
	facility_size_ngn: number;
	mgmt_fee_ngn: number;
	insurance_cost_ngn: number;
	interest_terms: string;
	interest_amount_ngn: number;
	tenure: string;
	moratorium: string;
	monthly_repayment: string;
	total_repayable_ngn: number;
	disbursement_date: string;
	delivery_date: string;
	final_repayment_date: string;
}

export type InstallmentStatus =
	| 'paid'
	| 'not_yet_due'
	| 'on_track'
	| 'late'
	| 'at_risk';

export interface Installment {
	installment_id: string;
	loan_id: string;
	installment_no: number;
	due_date: string; // ISO YYYY-MM-DD
	amount_due_ngn: number;
	repayment_log: string; // raw value from sheet
	payment_date: string | null; // ISO or null
}

export interface InstallmentView extends Installment {
	status: InstallmentStatus;
	days_overdue: number; // 0 if not overdue
	days_until_due: number; // negative if overdue
}

export interface LoanView {
	loan: Loan;
	installments: InstallmentView[];
	account_status: InstallmentStatus;
	next_payment: InstallmentView | null;
	total_paid_ngn: number;
	outstanding_ngn: number;
}

export interface SheetSnapshot {
	loans: Loan[];
	installments: Installment[];
	fetched_at: string; // ISO timestamp
}
