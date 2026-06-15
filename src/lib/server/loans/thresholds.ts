import { env } from '$env/dynamic/private';
import type { StatusThresholds } from './status';

const { ALERT_LATE_DAYS, ALERT_AT_RISK_DAYS } = env;

export function getThresholds(): StatusThresholds {
	const lateDays = Number(ALERT_LATE_DAYS) || 1;
	const atRiskDays = Number(ALERT_AT_RISK_DAYS) || 5;
	return { lateDays, atRiskDays };
}
