import { sendSMSFallback } from './smsService';

export async function sendSmsFallback(targetPhone: string, message: string): Promise<string> {
	return sendSMSFallback(targetPhone, message);
}

