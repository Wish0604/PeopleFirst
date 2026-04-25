import * as admin from 'firebase-admin';

import { db } from '../../utils/firebase';
import { DeliveryChannel } from '../../utils/networkCheck';

export interface DeliveryTrackingPayload {
	alertId: string;
	channel: DeliveryChannel;
	status: 'SENT' | 'FAILED';
	message?: string;
	fcmMessageId?: string;
	error?: string;
	metadata?: Record<string, unknown>;
}

export async function trackDelivery({ alertId, channel, status, message, fcmMessageId, error, metadata }: DeliveryTrackingPayload): Promise<void> {
	const payload: Record<string, unknown> = {
		alertId,
		channel,
		status,
		message,
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
	};

	if (fcmMessageId) {
		payload.fcmMessageId = fcmMessageId;
	}

	if (error) {
		payload.error = error;
	}

	if (metadata && Object.keys(metadata).length > 0) {
		payload.metadata = metadata;
	}

	await db.collection('deliveryLogs').add(payload);
}

