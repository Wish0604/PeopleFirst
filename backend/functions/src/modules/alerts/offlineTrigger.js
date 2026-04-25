async function triggerOfflineAlert() {
  return {
    status: 'TRIGGERED',
    detail: 'Offline fallback marker recorded. Device-side siren and flash logic should execute locally.',
  };
}

module.exports = {
  triggerOfflineAlert,
};
