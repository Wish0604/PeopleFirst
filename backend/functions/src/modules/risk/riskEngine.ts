export type AlertRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskAssessmentInput {
	riskLevel?: unknown;
	riskScore?: unknown;
	hazardScore?: unknown;
	rainfallMm?: unknown;
	windSpeedKph?: unknown;
	floodRisk?: unknown;
	cycloneWarning?: unknown;
	earthquakeMagnitude?: unknown;
	evacuationRequired?: unknown;
	type?: unknown;
	alertType?: unknown;
	name?: unknown;
	zoneName?: unknown;
}

export interface RiskAssessment {
	level: AlertRiskLevel;
	score: number;
	reason: string;
	recommendedActions: string[];
}

const KNOWN_RISK_LEVELS: AlertRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function clampScore(score: number): number {
	if (score < 0) return 0;
	if (score > 100) return 100;
	return Math.round(score);
}

function toNumber(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === 'string' && value.trim().length > 0) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : undefined;
	}

	return undefined;
}

function toBoolean(value: unknown): boolean {
	if (typeof value === 'boolean') {
		return value;
	}

	if (typeof value === 'string') {
		return ['true', 'yes', '1', 'y', 'on', 'high', 'severe'].includes(value.trim().toLowerCase());
	}

	return false;
}

function readString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeRiskLevel(value: unknown): AlertRiskLevel | undefined {
	const candidate = readString(value)?.toUpperCase();
	return candidate && KNOWN_RISK_LEVELS.includes(candidate as AlertRiskLevel)
		? (candidate as AlertRiskLevel)
		: undefined;
}

function scoreFromInputs(input: RiskAssessmentInput): number {
	const explicitScore = toNumber(input.riskScore ?? input.hazardScore);
	if (explicitScore !== undefined) {
		return clampScore(explicitScore);
	}

	let score = 0;
	const rainfallMm = toNumber(input.rainfallMm) ?? 0;
	const windSpeedKph = toNumber(input.windSpeedKph) ?? 0;
	const earthquakeMagnitude = toNumber(input.earthquakeMagnitude) ?? 0;
	const type = readString(input.alertType ?? input.type)?.toUpperCase() ?? 'GENERAL';

	score += Math.min(rainfallMm, 120) * 0.4;
	score += Math.min(windSpeedKph, 160) * 0.35;
	score += Math.min(earthquakeMagnitude * 18, 60);

	if (toBoolean(input.floodRisk)) {
		score += 25;
	}

	if (toBoolean(input.cycloneWarning) || type === 'CYCLONE') {
		score += 20;
	}

	if (toBoolean(input.evacuationRequired) || type === 'EVACUATION') {
		score += 30;
	}

	if (type === 'EARTHQUAKE') {
		score += 15;
	}

	return clampScore(score);
}

function buildReason(input: RiskAssessmentInput, score: number, level: AlertRiskLevel): string {
	const sourceName = readString(input.zoneName ?? input.name) ?? 'location';
	const type = readString(input.alertType ?? input.type)?.toUpperCase() ?? 'GENERAL';

	if (level === 'CRITICAL') {
		return `Critical conditions detected for ${sourceName} (${type}) with score ${score}.`;
	}

	if (level === 'HIGH') {
		return `High risk conditions detected for ${sourceName} (${type}) with score ${score}.`;
	}

	if (level === 'MEDIUM') {
		return `Medium risk conditions detected for ${sourceName} (${type}) with score ${score}.`;
	}

	return `Low risk conditions detected for ${sourceName} (${type}) with score ${score}.`;
}

function buildRecommendedActions(level: AlertRiskLevel, input: RiskAssessmentInput): string[] {
	const type = readString(input.alertType ?? input.type)?.toUpperCase() ?? 'GENERAL';
	const actions: string[] = [];

	if (level === 'HIGH' || level === 'CRITICAL') {
		actions.push('Prepare for immediate evacuation');
		actions.push('Gather emergency supplies');
	}

	if (level === 'CRITICAL') {
		actions.push('Move to the nearest safe shelter now');
	}

	if (type === 'FLOOD') {
		actions.push('Move to higher ground immediately');
	}

	if (type === 'CYCLONE') {
		actions.push('Secure loose outdoor items and stay indoors');
	}

	if (type === 'EARTHQUAKE') {
		actions.push('Drop, cover, and hold on');
	}

	if (type === 'EVACUATION') {
		actions.push('Follow the directed evacuation route');
	}

	if (actions.length === 0) {
		actions.push('Stay calm and monitor official updates');
	}

	return actions;
}

export function evaluateRiskLevel(input: RiskAssessmentInput): RiskAssessment {
	const explicitLevel = normalizeRiskLevel(input.riskLevel);
	const level = explicitLevel ?? (() => {
		const score = scoreFromInputs(input);
		if (score >= 85) return 'CRITICAL' as AlertRiskLevel;
		if (score >= 65) return 'HIGH' as AlertRiskLevel;
		if (score >= 35) return 'MEDIUM' as AlertRiskLevel;
		return 'LOW' as AlertRiskLevel;
	})();

	const score = explicitLevel
		? ({ LOW: 10, MEDIUM: 45, HIGH: 75, CRITICAL: 95 } as const)[explicitLevel]
		: scoreFromInputs(input);

	return {
		level,
		score,
		reason: buildReason(input, score, level),
		recommendedActions: buildRecommendedActions(level, input),
	};
}

