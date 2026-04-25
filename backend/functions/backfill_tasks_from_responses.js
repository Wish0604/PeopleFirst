const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

function normalizeStatus(value) {
  const status = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (status === 'SAFE') return 'SAFE';
  if (status === 'NEED_HELP' || status === 'HELP') return 'NEED_HELP';
  return null;
}

function readString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

async function backfillTasks() {
  const responsesSnapshot = await db.collection('responses').get();
  let created = 0;
  let skipped = 0;

  for (const responseDoc of responsesSnapshot.docs) {
    const response = responseDoc.data();
    const status = normalizeStatus(response.status);
    if (status !== 'NEED_HELP') {
      continue;
    }

    const alertId = readString(response.alertId);
    const userId = readString(response.userId);
    if (!alertId || !userId) {
      skipped += 1;
      continue;
    }

    const existingTasksSnapshot = await db
      .collection('tasks')
      .where('alertId', '==', alertId)
      .where('requesterUserId', '==', userId)
      .get();

    const hasOpenTask = existingTasksSnapshot.docs.some((doc) => {
      const taskStatus = readString(doc.data().status);
      return taskStatus === 'OPEN' || taskStatus === 'ASSIGNED' || taskStatus === 'IN_PROGRESS';
    });

    if (hasOpenTask) {
      skipped += 1;
      continue;
    }

    const alertSnapshot = await db.collection('alerts').doc(alertId).get();
    const alertData = alertSnapshot.exists ? alertSnapshot.data() : {};
    const riskLevel = readString(alertData.riskLevel) || 'UNKNOWN';
    const priority =
      riskLevel === 'CRITICAL' ? 'CRITICAL' :
      riskLevel === 'HIGH' ? 'HIGH' :
      riskLevel === 'MEDIUM' ? 'MEDIUM' : 'LOW';

    await db.collection('tasks').add({
      alertId,
      responseId: responseDoc.id,
      requesterUserId: userId,
      requesterEmail: readString(response.email),
      requesterLocation: response.location || null,
      status: 'OPEN',
      priority,
      riskLevel,
      title: `Rescue request for ${readString(response.email) || userId}`,
      description: readString(alertData.message) || 'Citizen requested emergency assistance.',
      sourceZoneId: readString(alertData.sourceZoneId),
      sourceZoneName: readString(alertData.sourceZoneName),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    created += 1;
  }

  console.log(`Backfill complete. Created tasks: ${created}, Skipped: ${skipped}`);
}

backfillTasks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Task backfill failed:', error);
    process.exit(1);
  });
