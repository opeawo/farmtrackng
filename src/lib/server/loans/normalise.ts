// Pure functions for cleaning sheet data. Tested independently.

/**
 * Normalise Nigerian phone numbers to +234XXXXXXXXXX form.
 * Returns null if the input cannot be confidently normalised.
 */
export function normalisePhone(raw: string | null | undefined): string | null {
	if (!raw) return null;
	// Strip everything except digits and a leading +
	const cleaned = String(raw).replace(/[\s\-()]/g, '').trim();
	if (!cleaned) return null;

	// Already in +234 form
	if (/^\+234\d{10}$/.test(cleaned)) return cleaned;
	// 234XXXXXXXXXX (no +)
	if (/^234\d{10}$/.test(cleaned)) return `+${cleaned}`;
	// 0XXXXXXXXXX (Nigerian local form, 11 digits)
	if (/^0\d{10}$/.test(cleaned)) return `+234${cleaned.slice(1)}`;
	// XXXXXXXXXX (10 digits, no leading 0)
	if (/^\d{10}$/.test(cleaned)) return `+234${cleaned}`;

	return null;
}

/** Loan IDs are case-insensitive. Trim + uppercase. */
export function normaliseLoanId(raw: string | null | undefined): string {
	if (!raw) return '';
	return String(raw).trim().toUpperCase();
}

/**
 * The sheet contains both "Received Payment" and the misspelling "Recieved Payment".
 * Treat both as evidence the row is paid. Falls back to truthy payment_date check
 * upstream — this is just for the repayment_log column.
 */
export function isReceivedPaymentLabel(raw: string | null | undefined): boolean {
	if (!raw) return false;
	const v = String(raw).trim().toLowerCase();
	return v === 'received payment' || v === 'recieved payment';
}

/** Parse a Naira money cell — handles "₦1,234.00", "1,234", numbers, blanks. */
export function parseMoney(raw: unknown): number {
	if (raw == null || raw === '') return 0;
	if (typeof raw === 'number') return raw;
	const s = String(raw).replace(/[₦,\s]/g, '');
	const n = Number(s);
	return Number.isFinite(n) ? n : 0;
}

/**
 * Parse a date cell into ISO YYYY-MM-DD. Handles common Sheets exports:
 *  - JS Date instance
 *  - ISO string
 *  - "DD/MM/YYYY" or "D/M/YYYY"
 *  - Blank / null
 */
export function parseDate(raw: unknown): string | null {
	if (raw == null || raw === '') return null;
	if (raw instanceof Date && !isNaN(raw.getTime())) {
		return raw.toISOString().slice(0, 10);
	}
	const s = String(raw).trim();
	if (!s) return null;
	// ISO already
	if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
	// DD/MM/YYYY (Nigerian convention)
	const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (m) {
		const [, d, mm, y] = m;
		return `${y}-${mm.padStart(2, '0')}-${d.padStart(2, '0')}`;
	}
	// Last-ditch: native parse
	const t = Date.parse(s);
	if (!isNaN(t)) return new Date(t).toISOString().slice(0, 10);
	return null;
}
