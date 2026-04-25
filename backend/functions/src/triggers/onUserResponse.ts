import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { db } from '../utils/firebase';
import { AlertRiskLevel, normalizeRiskLevel } from '../modules/risk/riskEngine';

function readString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeResponseStatus(value: unknown): 'SAFE' | 'NEED_HELP' | undefined {
	const status = readString(value)?.toUpperCase();
	if (status === 'SAFE') {
		return 'SAFE';
	}

	if (status === 'NEED_HELP' || status === 'HELP') {
		return 'NEED_HELP';
	}

	return undefined;
}

function toPriority(riskLevel: AlertRiskLevel | undefined): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
	if (riskLevel === 'CRITICAL') return 'CRITICAL';
	if (riskLevel === 'HIGH') return 'HIGH';
	if (riskLevel === 'MEDIUM') return 'MEDIUM';
	return 'LOW';
}

async function createRescueTaskIfNeeded(
	responseId: string,
	alertId: string,
	response: Record<string, unknown>
): Promise<void> {
	const userId = readString(response.userId);
	if (!userId) {
		return;
	}

	const existingTasksSnapshot = await db
		.collection('tasks')
		.where('alertId', '==', alertId)
		.where('requesterUserId', '==', userId)
		.get();

	const hasOpenTask = existingTasksSnapshot.docs.some((doc) => {
		const taskStatus = readString(doc.data().status)?.toUpperCase();
		return taskStatus === 'OPEN' || taskStatus === 'ASSIGNED' || taskStatus === 'IN_PROGRESS';
	});

	if (hasOpenTask) {
		logger.info('Skipping task creation because an active rescue task already exists', {
			alertId,
			responseId,
			userId,
		});
		return;
	}

	const alertSnapshot = await db.collection('alerts').doc(alertId).get();
	const alertData = alertSnapshot.exists ? (alertSnapshot.data() as Record<string, unknown>) : {};
	const riskLevel = normalizeRiskLevel(alertData.riskLevel);
	const priority = toPriority(riskLevel);

	await db.collection('tasks').add({
		alertId,
		responseId,
		requesterUserId: userId,
		requesterEmail: readString(response.email) ?? null,
		requesterLocation: response.location ?? null,
		status: 'OPEN',
		priority,
		riskLevel: riskLevel ?? 'UNKNOWN',
		title: `Rescue request for ${readString(response.email) ?? userId}`,
		description: readString(alertData.message) ?? 'Citizen requested emergency assistance.',
		sourceZoneId: readString(alertData.sourceZoneId) ?? null,
		sourceZoneName: readString(alertData.sourceZoneName) ?? null,
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	});

	logger.info('Created rescue task from NEED_HELP response', {
		alertId,
		responseId,
		userId,
		priority,
	});
}

export const onUserResponse = onDocumentCreated('responses/{responseId}', async (event) => {
	const response = event.data?.data() as Record<string, unknown> | undefined;
	if (!response) {
		return;
	}

	const alertId = readString(response.alertId);
	const status = normalizeResponseStatus(response.status);
	if (!alertId || !status) {
		logger.warn('Response missing alertId or status, skipping aggregation', { responseId: event.params.responseId });
		return;
	}

	const alertRef = db.collection('alerts').doc(alertId);
	const statusField = status === 'SAFE' ? 'safeCount' : 'needHelpCount';

	await alertRef.set({
		responseCount: admin.firestore.FieldValue.increment(1),
		[statusField]: admin.firestore.FieldValue.increment(1),
		lastResponseAt: admin.firestore.FieldValue.serverTimestamp(),
		lastResponseStatus: status,
		lastResponderId: readString(response.userId) ?? null,
		lastResponderEmail: readString(response.email) ?? null,
		lastResponderLocation: response.location ?? null,
		latestResponse: {
			responseId: event.params.responseId,
			status,
			userId: readString(response.userId) ?? null,
			email: readString(response.email) ?? null,
			createdAt: response.createdAt ?? null,
		},
	}, { merge: true });

	if (status === 'NEED_HELP') {
		await createRescueTaskIfNeeded(event.params.responseId, alertId, response);
	}

	logger.info('Aggregated user response into alert summary', {
		alertId,
		responseId: event.params.responseId,
		status,
	});
});

