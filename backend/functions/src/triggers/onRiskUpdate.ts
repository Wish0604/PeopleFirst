import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../utils/firebase';
import { evaluateIntelligentRisk } from '../modules/risk/riskEngine';
import { buildRiskAlertPayload, shouldRaiseAlert } from '../modules/risk/alertPayloadMapper';

export const onRiskUpdate = onDocumentWritten('zones/{zoneId}', async (event) => {
	const afterSnapshot = event.data?.after;
	if (!afterSnapshot?.exists) {
		return;
	}

	const zoneId = event.params.zoneId;
	const previousZone = event.data?.before?.exists ? (event.data.before.data() as Record<string, unknown>) : {};
	const currentZone = afterSnapshot.data() as Record<string, unknown>;
	const previousAssessment = evaluateIntelligentRisk(previousZone);
	const currentAssessment = evaluateIntelligentRisk(currentZone);

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

	const alertPayload = buildRiskAlertPayload({
		zoneId,
		zone: currentZone,
		assessment: currentAssessment,
	});

	await db.collection('alerts').add({
		...alertPayload,
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
	});

	logger.info('Risk update escalated into alert creation', {
		zoneId,
		zoneName: alertPayload.sourceZoneName,
		level: currentAssessment.level,
		score: currentAssessment.score,
	});
});

