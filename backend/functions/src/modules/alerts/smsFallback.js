async function sendSmsFallback() {
  throw new Error('SMS fallback is not configured yet. Integrate Twilio to enable this channel.');
}

module.exports = {
  sendSmsFallback,
};
