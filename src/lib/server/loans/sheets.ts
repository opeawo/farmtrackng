// Google Sheets read-only client.
// Service account: farmtrack@farmtrack-495410.iam.gserviceaccount.com
// Sheet ID set via env (LOAN_SHEET_ID).

import { google } from 'googleapis';
import {
	GOOGLE_SA_EMAIL,
	GOOGLE_SA_KEY,
	LOAN_SHEET_ID,
	LOAN_SHEET_LOANS_RANGE,
	LOAN_SHEET_INSTALLMENTS_RANGE
} from '$env/static/private';
import type { Installment, Loan, SheetSnapshot } from './types';
import {
	normalisePhone,
	normaliseLoanId,
	parseDate,
	parseMoney
} from './normalise';

const LOANS_RANGE = LOAN_SHEET_LOANS_RANGE || 'Loans!A1:Z1000';
const INSTALLMENTS_RANGE = LOAN_SHEET_INSTALLMENTS_RANGE || 'Installments!A1:Z5000';

function getClient() {
	if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_KEY || !LOAN_SHEET_ID) {
		throw new Error(
			'Google Sheets credentials missing. Set GOOGLE_SA_EMAIL, GOOGLE_SA_KEY, LOAN_SHEET_ID.'
		);
	}
	const auth = new google.auth.JWT({
		email: GOOGLE_SA_EMAIL,
		// Vercel envs escape newlines; un-escape them.
		key: GOOGLE_SA_KEY.replace(/\\n/g, '\n'),
		scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
	});
	return google.sheets({ version: 'v4', auth });
}

function rowsToObjects(rows: unknown[][] | null | undefined): Record<string, string>[] {
	if (!rows || rows.length === 0) return [];
	const [header, ...body] = rows;
	const headers = header.map((h) =>
		String(h || '')
			.trim()
			.toLowerCase()
			.replace(/[\s\-/]+/g, '_')
			.replace(/[^a-z0-9_]/g, '')
	);
	return body
		.filter((r) => r && r.some((c) => c != null && String(c).trim() !== ''))
		.map((r) => {
			const obj: Record<string, string> = {};
			headers.forEach((h, i) => {
				obj[h] = r[i] == null ? '' : String(r[i]).trim();
			});
			return obj;
		});
}

function pick(obj: Record<string, string>, ...keys: string[]): string {
	for (const k of keys) {
		if (obj[k] != null && obj[k] !== '') return obj[k];
	}
	return '';
}

function rowToLoan(o: Record<string, string>): Loan | null {
	const loan_id = normaliseLoanId(pick(o, 'loan_id', 'loanid', 'id'));
	if (!loan_id) return null;
	const phone = normalisePhone(pick(o, 'phone', 'phone_number', 'mobile')) || '';
	return {
		loan_id,
		business_name: pick(o, 'business_name', 'business', 'name'),
		contact_person: pick(o, 'contact_person', 'contact'),
		email: pick(o, 'email'),
		phone,
		equipment_financed: pick(o, 'equipment_financed', 'equipment'),
		facility_size_ngn: parseMoney(pick(o, 'facility_size_ngn', 'facility_size', 'principal')),
		mgmt_fee_ngn: parseMoney(pick(o, 'mgmt_fee_ngn', 'mgmt_fee', 'management_fee')),
		insurance_cost_ngn: parseMoney(pick(o, 'insurance_cost_ngn', 'insurance', 'insurance_cost')),
		interest_terms: pick(o, 'interest_terms'),
		interest_amount_ngn: parseMoney(pick(o, 'interest_amount_ngn', 'interest_amount')),
		tenure: pick(o, 'tenure'),
		moratorium: pick(o, 'moratorium'),
		monthly_repayment: pick(o, 'monthly_repayment'),
		total_repayable_ngn: parseMoney(pick(o, 'total_repayable_ngn', 'total_repayable')),
		disbursement_date: parseDate(pick(o, 'disbursement_date')) || '',
		delivery_date: parseDate(pick(o, 'delivery_date')) || '',
		final_repayment_date: parseDate(pick(o, 'final_repayment_date')) || ''
	};
}

function rowToInstallment(o: Record<string, string>): Installment | null {
	const loan_id = normaliseLoanId(pick(o, 'loan_id', 'loanid'));
	const installment_id = pick(o, 'installment_id', 'id');
	if (!loan_id || !installment_id) return null;
	const due_date = parseDate(pick(o, 'due_date')) || '';
	if (!due_date) return null;
	return {
		installment_id,
		loan_id,
		installment_no: Number(pick(o, 'installment_no', 'no', 'number')) || 0,
		due_date,
		amount_due_ngn: parseMoney(pick(o, 'amount_due_ngn', 'amount_due', 'amount')),
		repayment_log: pick(o, 'repayment_log', 'status'),
		payment_date: parseDate(pick(o, 'payment_date'))
	};
}

export async function fetchSheetSnapshot(): Promise<SheetSnapshot> {
	const sheets = getClient();
	const [loansRes, instRes] = await Promise.all([
		sheets.spreadsheets.values.get({
			spreadsheetId: LOAN_SHEET_ID,
			range: LOANS_RANGE,
			valueRenderOption: 'UNFORMATTED_VALUE',
			dateTimeRenderOption: 'FORMATTED_STRING'
		}),
		sheets.spreadsheets.values.get({
			spreadsheetId: LOAN_SHEET_ID,
			range: INSTALLMENTS_RANGE,
			valueRenderOption: 'UNFORMATTED_VALUE',
			dateTimeRenderOption: 'FORMATTED_STRING'
		})
	]);

	const loans = rowsToObjects(loansRes.data.values as unknown[][])
		.map(rowToLoan)
		.filter((l): l is Loan => !!l);

	const installments = rowsToObjects(instRes.data.values as unknown[][])
		.map(rowToInstallment)
		.filter((i): i is Installment => !!i);

	return {
		loans,
		installments,
		fetched_at: new Date().toISOString()
	};
}
