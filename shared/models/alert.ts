import { AlertRiskLevel, AlertType } from '../constants/enums';

export interface Alert {
	id: string;
	title: string;
	message: string;
	riskLevel: AlertRiskLevel;
	type: AlertType;
	createdAt?: string;
}

export interface DeliveryLog {
	id: string;
	alertId: string;
	channel: 'fcm' | 'sms' | 'voice';
	status: 'SENT' | 'FAILED' | 'PENDING';
	error?: string;
	createdAt?: string;
}
