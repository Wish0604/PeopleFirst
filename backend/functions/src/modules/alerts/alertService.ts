import { orchestrateAlertDelivery } from './alertOrchestrator';

export async function processAndSendAlert(alertId: string, alertData: Record<string, unknown>): Promise<void> {
	await orchestrateAlertDelivery(alertId, alertData);
}


