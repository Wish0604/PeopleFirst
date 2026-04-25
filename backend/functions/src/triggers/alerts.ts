import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { processAndSendAlert } from '../modules/alerts/alertService';

export const sendAlert = onDocumentCreated('alerts/{alertId}', async (event) => {
	const alertId = event.params.alertId;
	const alert = event.data?.data() ?? {};

	await processAndSendAlert(alertId, alert as Record<string, unknown>);
});

