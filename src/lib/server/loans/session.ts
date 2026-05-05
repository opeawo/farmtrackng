// Tiny signed-cookie session. The loan ID is the PIN — once auth has matched
// phone+loan_id against the sheet, we issue a cookie binding the browser to
// that loan_id only. No DB, no Supabase auth.

import crypto from 'node:crypto';
import { LOAN_SESSION_SECRET } from '$env/static/private';

const COOKIE_NAME = 'loan_sess';
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function sign(value: string): string {
	if (!LOAN_SESSION_SECRET) throw new Error('LOAN_SESSION_SECRET is not set');
	return crypto.createHmac('sha256', LOAN_SESSION_SECRET).update(value).digest('hex');
}

export function makeSessionCookie(loanId: string) {
	const issuedAt = Date.now();
	const payload = `${loanId}|${issuedAt}`;
	const sig = sign(payload);
	const value = `${payload}|${sig}`;
	return {
		name: COOKIE_NAME,
		value,
		options: {
			path: '/',
			httpOnly: true,
			sameSite: 'lax' as const,
			secure: true,
			maxAge: MAX_AGE_SECONDS
		}
	};
}

export function readSessionCookie(raw: string | undefined | null): { loanId: string } | null {
	if (!raw) return null;
	const parts = raw.split('|');
	if (parts.length !== 3) return null;
	const [loanId, issuedAt, sig] = parts;
	const expected = sign(`${loanId}|${issuedAt}`);
	if (sig.length !== expected.length) return null;
	if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
	const age = (Date.now() - Number(issuedAt)) / 1000;
	if (!Number.isFinite(age) || age > MAX_AGE_SECONDS) return null;
	return { loanId };
}

export const LOAN_COOKIE_NAME = COOKIE_NAME;
