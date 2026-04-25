const { admin } = require('../../config/firebase');

async function sendFcmAlert({ alertId, title, message, riskLevel, type }) {
  return admin.messaging().send({
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
}

module.exports = {
  sendFcmAlert,
};
