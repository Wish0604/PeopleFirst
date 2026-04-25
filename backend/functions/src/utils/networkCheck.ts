import { AlertRiskLevel, normalizeRiskLevel } from '../modules/risk/riskEngine';

export type DeliveryChannel = 'fcm' | 'sms' | 'voice' | 'offline';

export interface DeliveryChannelRequest {
	preferredChannel?: unknown;
	riskLevel?: unknown;
	targetPhone?: unknown;
}

function readString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function hasTargetPhone(value: unknown): boolean {
	return typeof value === 'string' && value.trim().length > 0;
}

function isSevereRisk(level: AlertRiskLevel | undefined): boolean {
	return level === 'HIGH' || level === 'CRITICAL';
}

export function getDeliveryChannels(alert: DeliveryChannelRequest): DeliveryChannel[] {
	const preferred = readString(alert.preferredChannel)?.toLowerCase();
	const riskLevel = normalizeRiskLevel(alert.riskLevel);
	const targetPhoneAvailable = hasTargetPhone(alert.targetPhone);

	if (preferred === 'offline') {
		return ['offline'];
	}

	if (preferred === 'sms') {
		return targetPhoneAvailable ? ['sms', 'voice', 'offline'] : ['offline'];
	}

	if (preferred === 'voice') {
		return targetPhoneAvailable ? ['voice', 'offline'] : ['offline'];
	}

	if (!targetPhoneAvailable) {
		return ['fcm', 'offline'];
	}

	if (isSevereRisk(riskLevel)) {
		return ['fcm', 'sms', 'voice', 'offline'];
	}

	return ['fcm', 'sms', 'offline'];
}

