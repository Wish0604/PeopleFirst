const logger = require('firebase-functions/logger');

const { getDeliveryChannels } = require('../../utils/networkCheck');
const { sendFcmAlert } = require('./fcmService');
const { sendSmsFallback } = require('./smsFallback');
const { triggerOfflineAlert } = require('./offlineTrigger');
const { trackDelivery } = require('./deliveryTracker');

async function attemptFcm(payload) {
  const fcmMessageId = await sendFcmAlert(payload);

  await trackDelivery({
    alertId: payload.alertId,
    channel: 'fcm',
    status: 'SENT',
    message: payload.message,
    fcmMessageId,
  });

  return { channel: 'fcm', status: 'SENT', fcmMessageId };
}

async function attemptSms(payload, originalError) {
  try {
    await sendSmsFallback(payload);

    await trackDelivery({
      alertId: payload.alertId,
      channel: 'sms',
      status: 'SENT',
      message: payload.message,
      metadata: originalError ? { fallbackReason: String(originalError.message || originalError) } : undefined,
    });

    return { channel: 'sms', status: 'SENT' };
  } catch (smsError) {
    await trackDelivery({
      alertId: payload.alertId,
      channel: 'sms',
      status: 'FAILED',
      message: payload.message,
      error: smsError instanceof Error ? smsError.message : String(smsError),
    });

    throw smsError;
  }
}

async function attemptOffline(payload, originalError) {
  await triggerOfflineAlert(payload);

  await trackDelivery({
    alertId: payload.alertId,
    channel: 'offline',
    status: 'SENT',
    message: payload.message,
    metadata: originalError ? { fallbackReason: String(originalError.message || originalError) } : undefined,
  });

  return { channel: 'offline', status: 'SENT' };
}

async function orchestrateAlertDelivery(alertId, alert) {
  const payload = {
    alertId,
    title: typeof alert.title === 'string' ? alert.title : 'Emergency Alert',
    message: typeof alert.message === 'string' ? alert.message : 'Emergency alert',
    riskLevel: alert.riskLevel,
    type: alert.type,
  };

  const channels = getDeliveryChannels(alert);
  let lastError = null;

  for (const channel of channels) {
    try {
      if (channel === 'fcm') {
        return await attemptFcm(payload);
      }

      if (channel === 'sms') {
        return await attemptSms(payload, lastError);
      }

      if (channel === 'offline') {
        return await attemptOffline(payload, lastError);
      }
    } catch (error) {
      lastError = error;
      logger.warn('Alert channel failed, trying next fallback', {
        alertId,
        channel,
        error: error instanceof Error ? error.message : String(error),
      });

      if (channel === 'fcm') {
        await trackDelivery({
          alertId,
          channel: 'fcm',
          status: 'FAILED',
          message: payload.message,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  throw lastError || new Error('No delivery channels available for alert.');
}

module.exports = {
  orchestrateAlertDelivery,
};
