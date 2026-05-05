import { ALERT_LATE_DAYS, ALERT_AT_RISK_DAYS } from '$env/static/private';
import type { StatusThresholds } from './status';

export function getThresholds(): StatusThresholds {
	const lateDays = Number(ALERT_LATE_DAYS) || 1;
	const atRiskDays = Number(ALERT_AT_RISK_DAYS) || 5;
	return { lateDays, atRiskDays };
}
