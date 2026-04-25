function getDeliveryChannels(alert) {
  const preferred = typeof alert.preferredChannel === 'string' ? alert.preferredChannel.toLowerCase() : '';

  if (preferred === 'offline') {
    return ['offline'];
  }

  if (preferred === 'sms') {
    return ['sms', 'offline'];
  }

  return ['fcm', 'sms', 'offline'];
}

module.exports = {
  getDeliveryChannels,
};
