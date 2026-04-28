import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { db } from '../utils/firebase';
import { fetchAllExternalSignals } from '../modules/ingestion/sourceAdapters';
import { normalizeExternalSignal } from '../modules/ingestion/normalizer';
import { aggregateSignalsByZone } from '../modules/ingestion/zoneAggregator';
import { mapZoneToRiskDocument } from '../modules/ingestion/zoneRiskMapper';

function sanitizeDocId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export const scheduledExternalDataIngestion = onSchedule('every 5 minutes', async () => {
  const startedAt = Date.now();

  const rawSignals = await fetchAllExternalSignals();
  const normalizedSignals = rawSignals
    .map((signal) => normalizeExternalSignal(signal))
    .filter((signal): signal is NonNullable<typeof signal> => signal !== null);

  const runRef = db.collection('ingestionRuns').doc();

  if (normalizedSignals.length === 0) {
    await runRef.set({
      status: 'NO_DATA',
      source: 'MULTI_SOURCE',
      rawSignals: rawSignals.length,
      normalizedSignals: 0,
      zonesUpdated: 0,
      durationMs: Date.now() - startedAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.warn('External ingestion completed with no usable signals', {
      rawSignals: rawSignals.length,
    });
    return;
  }

  const aggregatedZones = aggregateSignalsByZone(normalizedSignals);
  const batch = db.batch();

  for (const signal of normalizedSignals) {
    const signalId = sanitizeDocId(
      `${signal.source}_${signal.zoneId}_${signal.sourceTimestamp.toISOString()}`
    );

    batch.set(db.collection('externalSignals').doc(signalId), {
      ...signal,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  for (const zone of aggregatedZones) {
    const zoneRiskDoc = mapZoneToRiskDocument(zone);

    batch.set(
      db.collection('zones').doc(zone.zoneId),
      {
        ...zoneRiskDoc,
        lastIngestedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  batch.set(runRef, {
    status: 'SUCCESS',
    source: 'MULTI_SOURCE',
    rawSignals: rawSignals.length,
    normalizedSignals: normalizedSignals.length,
    zonesUpdated: aggregatedZones.length,
    durationMs: Date.now() - startedAt,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  logger.info('External ingestion completed successfully', {
    rawSignals: rawSignals.length,
    normalizedSignals: normalizedSignals.length,
    zonesUpdated: aggregatedZones.length,
  });
});
