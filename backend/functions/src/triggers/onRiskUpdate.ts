import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../utils/firebase';
import { AlertRiskLevel, evaluateRiskLevel } from '../modules/risk/riskEngine';

function readString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function shouldRaiseAlert(level: AlertRiskLevel): boolean {
	return level === 'HIGH' || level === 'CRITICAL';
}

function buildAlertTitle(zoneName: string, level: AlertRiskLevel): string {
	return `Emergency ${level} for ${zoneName}`;
}

function buildAlertMessage(zoneName: string, level: AlertRiskLevel, reason: string, actions: string[]): string {
	const actionText = actions.length > 0 ? ` Actions: ${actions.join('; ')}.` : '';
	return `${zoneName} is now at ${level} risk. ${reason}${actionText}`;
}

export const onRiskUpdate = onDocumentWritten('zones/{zoneId}', async (event) => {
	const afterSnapshot = event.data?.after;
	if (!afterSnapshot?.exists) {
		return;
	}

	const zoneId = event.params.zoneId;
	const previousZone = event.data?.before?.exists ? (event.data.before.data() as Record<string, unknown>) : {};
	const currentZone = afterSnapshot.data() as Record<string, unknown>;
	const previousAssessment = evaluateRiskLevel(previousZone);
	const currentAssessment = evaluateRiskLevel(currentZone);

	if (previousAssessment.level === currentAssessment.level) {
		return;
	}

	if (!shouldRaiseAlert(currentAssessment.level)) {
		logger.info('Risk update below alert threshold, skipping alert creation', {
			zoneId,
			level: currentAssessment.level,
			score: currentAssessment.score,
		});
		return;
	}

	const zoneName = readString(currentZone.zoneName ?? currentZone.name ?? currentZone.title) ?? `Zone ${zoneId}`;
	const alertType = readString(currentZone.alertType ?? currentZone.type)?.toUpperCase() ?? 'GENERAL';
	const targetPhone = readString(currentZone.targetPhone);
	const preferredChannel = readString(currentZone.preferredChannel)?.toLowerCase();

	await db.collection('alerts').add({
		title: buildAlertTitle(zoneName, currentAssessment.level),
		message: buildAlertMessage(zoneName, currentAssessment.level, currentAssessment.reason, currentAssessment.recommendedActions),
		riskLevel: currentAssessment.level,
		type: alertType,
		source: 'zone-risk',
		sourceZoneId: zoneId,
		sourceZoneName: zoneName,
		riskScore: currentAssessment.score,
		recommendedActions: currentAssessment.recommendedActions,
		preferredChannel,
		targetPhone,
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
	});

	logger.info('Risk update escalated into alert creation', {
		zoneId,
		zoneName,
		level: currentAssessment.level,
		score: currentAssessment.score,
	});
});

