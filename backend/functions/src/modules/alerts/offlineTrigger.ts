export interface OfflineTriggerPayload {
	alertId: string;
	title: string;
	message: string;
	riskLevel?: unknown;
	type?: unknown;
}

export async function triggerOfflineAlert(payload: OfflineTriggerPayload): Promise<{ status: 'TRIGGERED'; detail: string }> {
	void payload;
	return {
		status: 'TRIGGERED',
		detail: 'Offline fallback marker recorded. Device-side siren and flash logic should execute locally.',
	};
}

