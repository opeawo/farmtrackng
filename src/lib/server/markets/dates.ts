// WAT (Africa/Lagos) calendar-date helpers shared by the price history endpoints.

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in West Africa Time, YYYY-MM-DD. */
export function todayWat(): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Africa/Lagos',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
}

/** Shift a YYYY-MM-DD date by a whole number of days. */
export function shiftDays(date: string, delta: number): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + delta);
	return d.toISOString().slice(0, 10);
}
