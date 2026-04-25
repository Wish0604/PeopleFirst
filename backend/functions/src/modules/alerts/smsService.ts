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

export async function sendSMSFallback(targetPhone: string, message: string): Promise<string> {
  try {
    if (!hasRealTwilioConfig()) {
      logger.info("[MOCK] SMS sent via Twilio", { targetPhone, message });
      return "mock_sms_id_123";
    }

    const response = await getTwilioClient().messages.create({
      body: message,
      from: twilioNumber,
      to: targetPhone,
    });
    
    logger.info("SMS sent via Twilio", { targetPhone, messageId: response.sid });
    return response.sid;
  } catch (error) {
    logger.error("Failed to send SMS fallback", { targetPhone, error });
    throw error;
  }
}
