import twilio from "twilio";
import * as logger from "firebase-functions/logger";

const accountSid = process.env.TWILIO_ACCOUNT_SID || "dummy_account_sid";
const authToken = process.env.TWILIO_AUTH_TOKEN || "dummy_auth_token";
const twilioNumber = process.env.TWILIO_PHONE_NUMBER || "+1234567890";

function hasRealTwilioConfig(): boolean {
  return accountSid.startsWith("AC") && authToken !== "dummy_auth_token";
}

function getTwilioClient(): ReturnType<typeof twilio> {
  return twilio(accountSid, authToken);
}

export async function sendVoiceFallback(targetPhone: string, message: string): Promise<string> {
  try {
    if (!hasRealTwilioConfig()) {
      logger.info("[MOCK] Voice call initiated via Twilio", { targetPhone, message });
      return "mock_voice_id_123";
    }

    const response = await getTwilioClient().calls.create({
      twiml: `<Response><Say>${message}</Say></Response>`,
      from: twilioNumber,
      to: targetPhone,
    });
    
    logger.info("Voice call initiated via Twilio", { targetPhone, callSid: response.sid });
    return response.sid;
  } catch (error) {
    logger.error("Failed to initiate voice fallback", { targetPhone, error });
    throw error;
  }
}
