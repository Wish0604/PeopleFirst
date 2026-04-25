import * as logger from 'firebase-functions/logger';

import { sendVoiceFallback } from './voiceService';
import { sendSmsFallback } from './smsFallback';
import { sendFcmAlert } from './fcmService';
import { trackDelivery } from './deliveryTracker';
import { triggerOfflineAlert } from './offlineTrigger';
import { getDeliveryChannels, DeliveryChannel } from '../../utils/networkCheck';

export interface AlertDeliveryPayload {
	alertId: string;
	title: string;
	message: string;
	riskLevel?: unknown;
	type?: unknown;
	preferredChannel?: unknown;
	targetPhone?: unknown;
}

export interface DeliveryOutcome {
	channel: DeliveryChannel;
	status: 'SENT' | 'FAILED';
	fcmMessageId?: string;
}

// Circuit breaker pattern for resilient channel management
interface CircuitBreakerState {
	failureCount: number;
	lastFailureTime: number;
	isOpen: boolean;
}

// Global deduplication set and circuit breaker state
const processedAlerts = new Set<string>();
const channelCircuitBreakers = new Map<DeliveryChannel, CircuitBreakerState>(
	['fcm', 'sms', 'voice', 'offline'].map((ch) => [
		ch as DeliveryChannel,
		{ failureCount: 0, lastFailureTime: 0, isOpen: false },
	])
);

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_TIME = 60000; // 1 minute
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;
const VALIDATION_TIMEOUT_MS = 5000;

function readString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function validatePayload(payload: AlertDeliveryPayload): void {
	if (!payload.alertId || payload.alertId.trim().length === 0) {
		throw new Error('Invalid payload: alertId is required');
	}
	if (!payload.title || payload.title.trim().length === 0) {
		throw new Error('Invalid payload: title is required');
	}
	if (!payload.message || payload.message.trim().length === 0) {
		throw new Error('Invalid payload: message is required');
	}
}

function isCircuitBreakerOpen(channel: DeliveryChannel): boolean {
	const breaker = channelCircuitBreakers.get(channel);
	if (!breaker) return false;

	if (!breaker.isOpen) return false;

	const timeSinceLastFailure = Date.now() - breaker.lastFailureTime;
	if (timeSinceLastFailure > CIRCUIT_BREAKER_RESET_TIME) {
		breaker.failureCount = 0;
		breaker.isOpen = false;
		logger.info(`Circuit breaker reset for channel: ${channel}`);
		return false;
	}

	return true;
}

function recordChannelFailure(channel: DeliveryChannel): void {
	const breaker = channelCircuitBreakers.get(channel);
	if (breaker) {
		breaker.failureCount += 1;
		breaker.lastFailureTime = Date.now();

		if (breaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
			breaker.isOpen = true;
			logger.warn(`Circuit breaker opened for channel: ${channel}`);
		}
	}
}

function recordChannelSuccess(channel: DeliveryChannel): void {
	const breaker = channelCircuitBreakers.get(channel);
	if (breaker) {
		breaker.failureCount = 0;
		breaker.isOpen = false;
	}
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) =>
			setTimeout(() => reject(new Error(`${operationName} timeout after ${timeoutMs}ms`)), timeoutMs)
		),
	]);
}

async function retryWithBackoff<T>(
	operation: () => Promise<T>,
	operationName: string,
	maxRetries: number = MAX_RETRIES
): Promise<T> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
			if (attempt > 0) {
				logger.info(`Retrying ${operationName}, attempt ${attempt + 1}/${maxRetries} after ${backoffMs}ms`);
				await sleep(backoffMs);
			}

			return await withTimeout(operation(), VALIDATION_TIMEOUT_MS, operationName);
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			logger.warn(`${operationName} attempt ${attempt + 1} failed`, {
				error: lastError.message,
				attempt: attempt + 1,
				maxRetries,
			});
		}
	}

	throw lastError || new Error(`${operationName} failed after ${maxRetries} retries`);
}

async function attemptFcm(payload: AlertDeliveryPayload): Promise<DeliveryOutcome> {
	if (isCircuitBreakerOpen('fcm')) {
		throw new Error('FCM channel circuit breaker is open');
	}

	try {
		const fcmMessageId = await retryWithBackoff(
			() => sendFcmAlert(payload),
			'FCM alert delivery'
		);

		await trackDelivery({
			alertId: payload.alertId,
			channel: 'fcm',
			status: 'SENT',
			message: payload.message,
			fcmMessageId,
		});

		recordChannelSuccess('fcm');
		return { channel: 'fcm', status: 'SENT', fcmMessageId };
	} catch (error) {
		recordChannelFailure('fcm');
		throw error;
	}
}

async function attemptSms(payload: AlertDeliveryPayload, originalError?: Error | null): Promise<DeliveryOutcome> {
	if (isCircuitBreakerOpen('sms')) {
		throw new Error('SMS channel circuit breaker is open');
	}

	const targetPhone = readString(payload.targetPhone);
	if (!targetPhone) {
		const error = new Error('No target phone provided for SMS fallback.');
		await trackDelivery({
			alertId: payload.alertId,
			channel: 'sms',
			status: 'FAILED',
			message: payload.message,
			error: error.message,
		});
		recordChannelFailure('sms');
		throw error;
	}

	try {
		await retryWithBackoff(
			() => sendSmsFallback(targetPhone, `ALERT: ${payload.title} - ${payload.message}`),
			'SMS alert delivery'
		);

		await trackDelivery({
			alertId: payload.alertId,
			channel: 'sms',
			status: 'SENT',
			message: payload.message,
			metadata: originalError ? { fallbackReason: String(originalError.message || originalError) } : undefined,
		});

		recordChannelSuccess('sms');
		return { channel: 'sms', status: 'SENT' };
	} catch (error) {
		await trackDelivery({
			alertId: payload.alertId,
			channel: 'sms',
			status: 'FAILED',
			message: payload.message,
			error: error instanceof Error ? error.message : String(error),
		});
		recordChannelFailure('sms');

		throw error instanceof Error ? error : new Error(String(error));
	}
}

async function attemptVoice(payload: AlertDeliveryPayload, originalError?: Error | null): Promise<DeliveryOutcome> {
	if (isCircuitBreakerOpen('voice')) {
		throw new Error('Voice channel circuit breaker is open');
	}

	const targetPhone = readString(payload.targetPhone);
	if (!targetPhone) {
		const error = new Error('No target phone provided for voice fallback.');
		await trackDelivery({
			alertId: payload.alertId,
			channel: 'voice',
			status: 'FAILED',
			message: payload.message,
			error: error.message,
		});
		recordChannelFailure('voice');
		throw error;
	}

	try {
		const voiceMessage = `Emergency Alert. ${payload.title}. ${payload.message}`;
		const voiceId = await retryWithBackoff(
			() => sendVoiceFallback(targetPhone, voiceMessage),
			'Voice alert delivery'
		);

		await trackDelivery({
			alertId: payload.alertId,
			channel: 'voice',
			status: 'SENT',
			message: payload.message,
			metadata: {
				...(originalError ? { fallbackReason: String(originalError.message || originalError) } : {}),
				voiceMessage,
			},
		});

		recordChannelSuccess('voice');
		return { channel: 'voice', status: 'SENT', fcmMessageId: voiceId };
	} catch (error) {
		await trackDelivery({
			alertId: payload.alertId,
			channel: 'voice',
			status: 'FAILED',
			message: payload.message,
			error: error instanceof Error ? error.message : String(error),
		});
		recordChannelFailure('voice');

		throw error instanceof Error ? error : new Error(String(error));
	}
}

async function attemptOffline(payload: AlertDeliveryPayload, originalError?: Error | null): Promise<DeliveryOutcome> {
	if (isCircuitBreakerOpen('offline')) {
		throw new Error('Offline channel circuit breaker is open');
	}

	try {
		await retryWithBackoff(
			() => triggerOfflineAlert(payload),
			'Offline alert trigger'
		);

		await trackDelivery({
			alertId: payload.alertId,
			channel: 'offline',
			status: 'SENT',
			message: payload.message,
			metadata: originalError ? { fallbackReason: String(originalError.message || originalError) } : undefined,
		});

		recordChannelSuccess('offline');
		return { channel: 'offline', status: 'SENT' };
	} catch (error) {
		await trackDelivery({
			alertId: payload.alertId,
			channel: 'offline',
			status: 'FAILED',
			message: payload.message,
			error: error instanceof Error ? error.message : String(error),
		});
		recordChannelFailure('offline');

		throw error instanceof Error ? error : new Error(String(error));
	}
}

export async function orchestrateAlertDelivery(alertId: string, alert: Record<string, unknown>): Promise<DeliveryOutcome> {
	// Deduplication: Check if alert was already processed
	if (processedAlerts.has(alertId)) {
		logger.warn('Duplicate alert detected and skipped', { alertId });
		throw new Error(`Alert ${alertId} has already been processed`);
	}

	const payload: AlertDeliveryPayload = {
		alertId,
		title: readString(alert.title) ?? 'Emergency Alert',
		message: readString(alert.message) ?? 'Emergency alert',
		riskLevel: alert.riskLevel,
		type: alert.type,
		preferredChannel: alert.preferredChannel,
		targetPhone: alert.targetPhone,
	};

	// Validate payload before processing
	try {
		validatePayload(payload);
	} catch (validationError) {
		const error = validationError instanceof Error ? validationError : new Error(String(validationError));
		logger.error('Alert validation failed', { alertId, error: error.message });
		throw error;
	}

	// Mark as processed to prevent duplicates
	processedAlerts.add(alertId);

	const channels = getDeliveryChannels(payload);
	let lastError: Error | null = null;

	logger.info('Starting alert orchestration', {
		alertId,
		channels: channels.length > 0 ? channels : 'No channels available',
		title: payload.title,
	});

	for (const channel of channels) {
		try {
			if (isCircuitBreakerOpen(channel)) {
				logger.warn('Channel circuit breaker is open, skipping', { alertId, channel });
				continue;
			}

			if (channel === 'fcm') {
				return await attemptFcm(payload);
			}

			if (channel === 'sms') {
				return await attemptSms(payload, lastError);
			}

			if (channel === 'voice') {
				return await attemptVoice(payload, lastError);
			}

			if (channel === 'offline') {
				return await attemptOffline(payload, lastError);
			}
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			logger.warn('Alert channel failed, trying next fallback', {
				alertId,
				channel,
				error: lastError.message,
			});
		}
	}

	// Clean up processed alert on final failure (allow retry)
	processedAlerts.delete(alertId);

	const finalError = lastError || new Error('No delivery channels available for alert.');
	logger.error('All delivery channels exhausted', {
		alertId,
		error: finalError.message,
		lastChannel: channels[channels.length - 1] || 'NONE',
	});

	throw finalError;
}

