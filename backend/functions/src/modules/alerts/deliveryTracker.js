const { admin, db } = require('../../config/firebase');

async function trackDelivery({ alertId, channel, status, message, fcmMessageId, error, metadata }) {
  const payload = {
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

  if (metadata && typeof metadata === 'object') {
    payload.metadata = metadata;
  }

  await db.collection('deliveryLogs').add(payload);
}

module.exports = {
  trackDelivery,
};
