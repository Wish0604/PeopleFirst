import * as admin from 'firebase-admin';

export interface FcmAlertPayload {
	alertId: string;
	title: string;
	message: string;
	riskLevel?: unknown;
	type?: unknown;
}

export async function sendFcmAlert({ alertId, title, message, riskLevel, type }: FcmAlertPayload): Promise<string> {
	const messageId = await admin.messaging().send({
		topic: 'all_users',
		notification: {
			title,
			body: message,
		},
		data: {
			alertId,
			riskLevel: String(riskLevel || 'UNKNOWN'),
			type: String(type || 'GENERAL'),
		},
	});

	return messageId;
}

