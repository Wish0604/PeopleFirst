const admin = require('firebase-admin');

async function main() {
  try {
    admin.initializeApp();
    const db = admin.firestore();

    // Find the latest alert by createdAt
    const snaps = await db.collection('alerts').orderBy('createdAt', 'desc').limit(1).get();
    if (snaps.empty) {
      console.log('No alerts found');
      return;
    }
    const alertDoc = snaps.docs[0];
    const alertId = alertDoc.id;
    console.log('Target alert:', alertId);

    // Resend: add deliveryLog
    const dl = await db.collection('delivery_logs').add({
      alertId,
      channel: 'MANUAL_RESEND',
      status: 'RETRY',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'script-trigger'
    });
    console.log('Added delivery_logs doc:', dl.id);

    // Audit log for resend
    const a1 = await db.collection('auditLogs').add({
      action: 'RESEND',
      alertId,
      actor: 'script-trigger',
      outcome: 'REQUESTED',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Audit log created:', a1.id);

    // Escalate: update alert
    await db.collection('alerts').doc(alertId).update({
      riskPriority: 'CRITICAL',
      escalatedAt: admin.firestore.FieldValue.serverTimestamp(),
      escalatedBy: 'script-trigger'
    });
    console.log('Alert escalated');

    // Audit for escalate
    const a2 = await db.collection('auditLogs').add({
      action: 'ESCALATE',
      alertId,
      actor: 'script-trigger',
      outcome: 'UPDATED_ALERT',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Audit log created:', a2.id);

    // Cancel: update alert status
    await db.collection('alerts').doc(alertId).update({
      status: 'CANCELLED',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelledBy: 'script-trigger'
    });
    console.log('Alert cancelled');

    const a3 = await db.collection('auditLogs').add({
      action: 'CANCEL',
      alertId,
      actor: 'script-trigger',
      outcome: 'UPDATED_ALERT',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Audit log created:', a3.id);

    console.log('All actions completed');
  } catch (err) {
    console.error('Error running trigger script', err);
    process.exitCode = 1;
  }
}

main();
